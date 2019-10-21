var origin = null,
    app_guid = null,
    settings = null,
    subdomain = null,
    submitTicketID = null,
    submitRecipientList = null,
    submitPayload = {}; // need to set this up as the right object to send to the api on submit click

var client = ZAFClient.init();


$(function() {
  
  var url_string = window.location.href;
  var url = new URL(url_string);
  origin = url.searchParams.get("origin");
  app_guid = url.searchParams.get("app_guid");
  
  //get app metadata, validate url params
  client.metadata().then(function(metadata) {
    var URLvalidated = URLvalidatedParams();
        settings = metadata.settings; 
    if(URLvalidated.valid){
      submitTicketID = URLvalidated.ticket_id;
      submitRecipientList = URLvalidated.recipient_list;
      // if the url params are valid, inform the app of that state to trigger ticket validation
      client.trigger('params_valid', URLvalidated);
      client.context().then(function(context) {
        subdomain = context.account.subdomain;
      });
    }
  });

  client.on('params_valid', function(urlData) {
    // if url params are valid, validate the ticket
    validateTicket(urlData);
  });
  
  client.on('ticket_valid', function(urlData) {
    // if the ticket is valid, queue up user validation of requester list
    submitPayload.ticket = urlData.mutated_ticket;
    client.trigger('validate_users',urlData);
  });

  client.on('ticket_invalid', function(urlData) {

    showTicket('ticket invalid');
  });

  client.on('validate_users', function(urlData) {
    validateUsers(urlData.recipient_list, settings);
    client.on('all_users_found', function(response) {
      showPage(response,urlData.mutated_ticket,'>Proceed', null);
      submitPayload.recipients = response;
      getFirstComment(urlData.ticket_id);

    });   
    client.on('not_all_users_found', function(response) {
      showPage(response,urlData.mutated_ticket,'>Proceed Anyway', `Only found ${response.length} / ${urlData.recipient_list.length} users. Proceed anyway?`);
      submitPayload.recipients = response;
      getFirstComment(urlData.ticket_id);
    });

    client.on('no_users_found', function(response) {
      showPage(response,urlData.mutated_ticket,' disabled>Proceed Anyway', `Found ${response.length} / ${urlData.recipient_list.length} users.`);
      submitPayload.recipients = response;
      getFirstComment(urlData.ticket_id);
      //client.trigger('getTicketComments',urlData.ticket_id);
    });
  });

  client.on('return_comment', function(comment) {
    $('#commentBox').html(comment);
    client.trigger('ready_for_submit');
  });

  client.on('postTickets', function(data) {
    client.request({
      url: '/api/v2/tickets/create_many.json',
      contentType: 'application/json',
      type: 'POST',
      data: JSON.stringify(data)
    }).then(function(data) {
      $('#content').html(`<form action="/progress.html" method="get" accept-charset="utf-8"><input type="hidden" name="results" value=${JSON.stringify(data)}><input type="hidden" name="app_guid" value=${app_guid}><input type="hidden" name="origin" value=${origin}><input type="submit" id="c" hidden></form>`);
      $('#c').click();
    });
  });
});

function URLvalidatedParams(){ //if URLvalidated do the stuff, otherwise return the user to the main with 
  var regEx = /^\d+$/,
      url_string = window.location.href;

  var url = new URL(url_string);

  var ticket_id = url.searchParams.get("ticket_id"),
      recipient_list = url.searchParams.get("recipient_id"),
      external_id = url.searchParams.get("external_id");
  
  recipient_list = recipient_list.replace(/\s+/g,'').split(',');
  recipient_list = recipient_list.filter(recipient => recipient.length > 0);
  if(regEx.test(ticket_id) && regEx.test(recipient_list.join(""))){ // tests are passed
    return {
      'valid' : true,
      'ticket_id' : ticket_id,
      'recipient_list' : recipient_list
    };
  }else{
    return {
      'valid' : false,
      'ticket_id' : ticket_id,
      'recipient_list' : recipient_list
    };
  }
}

function validateTicket(urlData){
  client.request({
    url: `/api/v2/search.json?query=type:ticket ${urlData.ticket_id}`
  }).then(function(data){
    // inform the app of the validation outcome
    urlData.mutated_ticket = mutateTicket(data.results[0]);
    data.count === 1 ? client.trigger('ticket_valid', urlData) : client.trigger('ticket_invalid', urlData);
  });
}

function mutateTicket(ticketObject){
  //if validateTicket then:
  var essentialFields = ['type', 'subject', 'priority', 'assignee_id', 'group_id', 'custom_fields', 'fields', 'ticket_form_id', 'brand_id'];
  for(var prop in ticketObject){
    if(essentialFields.indexOf(prop) === -1){
      delete ticketObject[prop];
    }
  }
  return ticketObject;
}

function validateUsers(requester_list, settings) {
  var request_param = settings.external_id ? "external_ids" : "ids" ,
      request_url=  `/api/v2/users/show_many.json?${request_param}=${requester_list.join(",")}`;

  client.request({
    url: request_url
  }).then(function(data) {
    var sendArray = [];
    data.users.forEach(function(element, index) {
      sendArray.push(element.id);
    });
    if(sendArray.length === data.users.length) { 
      if(data.count !== 0){
        client.trigger((data.count === requester_list.length ? 'all_users_found' : 'not_all_users_found'), sendArray);
      } else {
        client.trigger('no_users_found', sendArray);
      }
    }
  });
}

function getFirstComment(ticket_id) {
  client.request(`/api/v2/tickets/${ticket_id}/comments.json?sort_order=desc`).then(function(response) {
    for(var comment of response.comments) {
      if(comment.public) {
        client.trigger('return_comment', comment.html_body);
        submitPayload.comment = {
          "html_body" : comment.html_body,
          "public" : true
        };
        client.get('currentUser').then(function(data){
          submitPayload.comment.author_id = data.currentUser.id; 
        });
        break;
      }    
    }
  });
}

function constructManyTickets() {
  var finalPayload = {
    "tickets" :[
    ]
  };
  for(var recipient of submitPayload.recipients) {
    var ticket = submitPayload.ticket;
    ticket.requester_id = recipient;
    ticket.comment = submitPayload.comment;
    finalPayload.tickets.push(ticket);
  }
  client.trigger('postTickets', finalPayload);
}

function changeCaseFirstLetter(params) {
  if(typeof params === 'string') {
    return params.charAt(0).toUpperCase() + params.slice(1);
  }
  return null;
}

function pushTicketPropToTemplate(newKey, ticket, template) {
  template.fields.push({
    "key" : changeCaseFirstLetter(newKey),
    "value" : ticket[newKey]
  });
}

function cancelSubmission() {

  window.location.assign(`iframe.html?origin=${origin}&app_guid=${app_guid}&ticket_id=${submitTicketID}&recipient_list=${submitRecipientList}`);
}

function showPage(userList, ticketObject, buttonText, warningText) {
  //do some stuff to ticketObject to get the `fields` template info. Make it an array
  $('#loader').hide();
  var elements = {
    'userResults' : `To: <div id="recipient-list" class="inline">${userList.length} Users</div>`,
    'subject' : ticketObject.subject,
    'ticketResults' : "<div class='inline' id='commentBox'></div>",
    'submitText' : `<button type='button' onclick='constructManyTickets()' ${buttonText}</button>`,
    'cancel' : `<button type='button' onclick='cancelSubmission()'>Cancel</button>`,
    'fields' : [],
    'warning' : (warningText !== null ? `<div class='result-wrapper warning'>${warningText}</div>` : null)
  };
  for(var prop in ticketObject) {
    if(prop!=='subject'){
      pushTicketPropToTemplate(prop, ticketObject, elements);
    } 
  }

  var source = $("#validation-template").html();
  var template = Handlebars.compile(source);
  var html = template(elements);
  $("#content").html(html);
}

