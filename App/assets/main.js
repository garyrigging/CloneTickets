var origin= null,
	app_guid = null;

$(function() {
    var client = ZAFClient.init(),
    	metadata = null;
   	client.metadata().then(function(data) {
   		metadata = data;
   		client.trigger('activate');
   	});
   	client.on('activate',function(){
   		var url_string = window.location.href;
   		var url = new URL(url_string);
  		origin = url.searchParams.get("origin");
  		app_guid = url.searchParams.get("app_guid");
  		showForm(metadata.settings.external_id);
   	});
});


function showForm(externalIDBoolean) {
  var ticketform_data = {
    'ticket_id_title': 'Clone Ticket ID:',
    'ticket_id_id': 'ticket_id',
    'ticket_id_type': 'number',
    'recipient_id_title': 'Recipient IDs (comma separated)',
    'recipient_id_id': 'recipient_id',
    'recipient_id_type': 'textarea',
    'recipient_id_subtitle': (externalIDBoolean ? 'Etsy User IDs' : 'Zendesk IDs'),
    'external_id': externalIDBoolean,
    'origin': origin,
    'app_guid': app_guid
  };

  var source = $("#composition-template").html();
  var template = Handlebars.compile(source);
  var html = template(ticketform_data);
  $("#content").html(html);
}