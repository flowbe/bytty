export function index(req, res) {
	res.render('pastebin', { csrfToken: req.csrfToken() })
}