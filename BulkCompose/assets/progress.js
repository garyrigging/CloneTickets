var client = ZAFClient.init();

$(function() {
  var url_string = window.location.href;
  var url = new URL(url_string);
  var results = JSON.parse(url.searchParams.get("results"));
  var elements = {
      'data' : JSON.stringify(results)
    };
  
  client.invoke('notify','Ticket Creation Job Started', 'notice');
  load(results);

});

function load(results) {
  var elem = document.getElementById("statusBar");   
  var width = 1;
  var id = setInterval(frame, 60000/30);
  function frame() {
    client.request(results.job_status.url).then(function(data) {
      switch(data.job_status.status) {
        case 'completed':
          elem.style.width = '100%';
          elem.innerHTML = '100%';
          client.invoke('notify','Ticket Creation Job Complete!', 'notice');
          clearInterval(id);
          break;
        case 'failed':
        case 'killed':
          elem.setAttribute('style', "width:100%; background-color:red;");
          elem.innerHTML = '100%';
          client.invoke('notify',`Ticket Creation Job Failed to Complete. \n\n${JSON.stringify(data.job_status,0,2)}`, 'error');
          clearInterval(id);
          break;
        case 'queued':
        case 'working':
          elem.style.width = (data.job_status.progress * 100 / data.job_status.total) + '%'; 
          elem.innerHTML = (data.job_status.progress * 100 / data.job_status.total)  + '%';
          client.invoke('notify',`${data.job_status.progress} / ${data.job_status.total} tickets created`, 'alert');
          break;
        default: 
          elem.setAttribute('style', "width:100%; background-color:red;");
          elem.innerHTML = '100%';
          client.invoke('notify',`Ticket Creation Job Failed to Complete. \n\n${JSON.stringify(data.job_status,0,2)}`, 'error');
          clearInterval(id);
          break;
      }
    });
  }
}

