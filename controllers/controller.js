import multer from 'multer'

var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './uploads');
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now());
	}
})
var fileUpload = multer({ storage: storage }).array('files[]')

export function index(req, res) {
	res.render('index')
}

export function upload(req, res) {
	fileUpload(req, res, (err) => {
		if (err) {
			console.error(err)
			res.status(500).end(JSON.stringify({ success: false, error: err.message }))
		} else {
			res.end(JSON.stringify({ success: true, error: null }))
		}
	})
}