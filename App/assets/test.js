var origin = null,
    app_guid = null;
$(function() {
  var client2 = ZAFClient.init();
  var validated = validateURLParams(client2);
  if(validated[0]){
    console.log(validated);
    //verifyRecipientList(validated[2]);
    getTicketData(client2, validated[1]);
  }else{
    console.log(validated);
  }
});

function validateURLParams(client){ //if validated do the stuff, otherwise return the user to the main with 
  var regEx = /^\d+$/;
  var url_string = window.location.href;
  var url = new URL(url_string);
  var ticket_id = url.searchParams.get("ticket_id"),
    recipient_list = url.searchParams.get("recipient_id"),
    external_id = url.searchParams.get("external_id");
    recipient_list = recipient_list.replace('/\s+/g','').split(',');
    recipient_list = recipient_list.filter(recipient => recipient.length > 0);
  if(regEx.test(ticket_id) && regEx.test(recipient_list.join(""))){ // tests are passed
    showticketPass(client, ticket_id);
    showRecipientPass(recipient_list);
    return [true, ticket_id,recipient_list];
  }else{
    return [false, ticket_id, recipient_list];
  }
}

function getTicketData(client, ticket_id){
  var deleteProps = ['id', 'tags', 'url', 'external_id', 'raw_subject', 'description', 'recipient', 'requester_id', 'organization_id', 'collaborator_ids', 'collaborators', 'email_cc_ids', 'follower_ids', 'forum_topic_id', 'problem_id', 'has_incidents', 'due_at', 'via', 'satisfaction_rating', 'sharing_agreement_ids', 'followup_ids', 'via_followup_source_id', 'macro_ids', 'allow_channelback', 'allow_attachments', 'is_public', 'created_at', 'updated_at', 'satisfaction_probability' , 'tags'];
  client.request(`/api/v2/tickets/${ticket_id}.json`).then(function(ticketObj){
    for(var prop of deleteProps){
      delete ticketObj.ticket[prop];
    }
    showTicket(JSON.stringify(data,0,2));
    client.request(`/api/v2/tickets/${ticket_id}/comments.json`).then(function(data){
      //showTicket(JSON.stringify(data,0,2));
    });
  });
  
}

function showTicket(ticketObject) {
  var ticket = {
    'ticketObject' : ticketObject 
  };

  var source = $("#validation-template").html();
  var template = Handlebars.compile(source);
  var html = template(ticket);
  $("#content").html(html);
}

function showticketPass(client, ticket_id) {
  console.log('ticket id passed '+ ticket_id);
}

function showRecipientPass(recipient_list) {
  console.log('recipient list passed ' + recipient_list);
}