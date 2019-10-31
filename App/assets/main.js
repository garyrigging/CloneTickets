var client = ZAFClient.init();

$(function() {
  var url_string = window.location.href;
  var url = new URL(url_string);
  var origin = url.searchParams.get("origin"),
  ticket_id = url.searchParams.get("ticket_id"),
  recipients = url.searchParams.get("recipient_list"),
  app_guid = url.searchParams.get("app_guid");
  showForm(origin, app_guid, ticket_id, recipients);
});

function showForm(origin, app_guid, ticket_id, recipients) {
  var ticketform_data = {
    'ticket_id_title': 'Clone Ticket ID:',
    'ticket_id_id': 'ticket_id',
    'ticket_id_type': 'number',
    'id_type_id' : 'external_id',
    'id_type_title' : 'What type of IDs are these?',
    'id_type_options' : [
      {
        'value': false,
        'title': 'Zendesk User IDs'
      },
      {
        'value': true,
        'title': 'Etsy User IDs'
      }
    ],
    'recipient_id_title': 'Recipient IDs (comma separated)',
    'recipient_id_id': 'recipient_id',
    'recipient_id_type': 'textarea',
    'origin': origin,
    'app_guid': app_guid,
    'passed_ticket_id': (ticket_id ? ticket_id : ''),
    'passed_recipient_list': (recipients ? recipients : '')
  };

  var source = $("#composition-template").html();
  var template = Handlebars.compile(source);
  var html = template(ticketform_data);
  $("#content").html(html);
}