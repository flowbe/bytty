// Handle tabs in textarea
$('textarea').keydown(function (e) {
	if (e.keyCode === 9) { // tab was pressed
		// get caret position/selection
		var start = this.selectionStart;
		var end = this.selectionEnd;

		var $this = $(this);
		var value = $this.val();

		// set textarea value to: text before caret + tab + text after caret
		$this.val(value.substring(0, start)
			+ '\t'
			+ value.substring(end));

		// put caret at right position again (add one for the tab)
		this.selectionStart = this.selectionEnd = start + 1;

		// prevent the focus lose
		e.preventDefault();
	}
});

// Submit form
$("#form").submit(function (e) {
	e.preventDefault(); // avoid to execute the actual submit of the form.

	var form = $(this),
		$errorMsg = $('#error_msg'),
		$downloadLink = $('#download_link');

	$.ajax({
		type: form.attr('method'),
		url: form.attr('action'),
		data: form.serialize(),
		dataType: 'json',
		success: function (data) {
			if (data.success) {
				$('.success-message').addClass('show');
				$downloadLink.attr('href', data.link);
				$downloadLink.text(data.link);
			} else {
				$('.error-message').addClass('show');
				$errorMsg.text(data.error);
			}
		},
		error: function (xhr) {
			$('.error-message').addClass('show');
			$errorMsg.text(xhr.responseJSON.error || 'Unexpected error, try again later');
		}
	});
});
