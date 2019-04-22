const multer = require('multer');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './public/img')
	},
	filename: function(req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname)
	}
})

function fileFilter(req, file, cb) {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true)
	} else {
		cb(new Error('Bạn chỉ được đăng tệp hình ảnh'));
	}
}

module.exports = multer({storage: storage, fileFilter: fileFilter});