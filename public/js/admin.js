// Insert Admin account
const addAdmin = (event) => {
	event.preventDefault();
	const admin = {
		username: event.target.childNodes[5].childNodes[3].childNodes[1].value,
		password: event.target.childNodes[7].childNodes[3].childNodes[1].value,
		fullname: event.target.childNodes[9].childNodes[3].childNodes[1].value,
		phone: event.target.childNodes[11].childNodes[3].childNodes[1].value,
		email: event.target.childNodes[13].childNodes[3].childNodes[1].value
	}

	fetch('admin/addAdminAccount', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
            'Content-Type': 'application/json'
		},
		body: JSON.stringify(admin)
	})
	.then(result => {
		return result.json();
	})
	.then(newAdmin => {
		if (typeof newAdmin === 'string') {
			document.querySelector('#notify').innerHTML = `<label class="control-label text-danger">${newAdmin}</label>`;
		} else {
			document.querySelector('#notify').innerHTML = `<label class="control-label text-success">Admin ${newAdmin.fullname} được tạo! Tải lại trang để cập nhật!</label>`;
			// Empty input
			event.target.childNodes[5].childNodes[3].childNodes[1].value = '';
			event.target.childNodes[7].childNodes[3].childNodes[1].value = '';
			event.target.childNodes[9].childNodes[3].childNodes[1].value = '';
			event.target.childNodes[11].childNodes[3].childNodes[1].value = '';
			event.target.childNodes[13].childNodes[3].childNodes[1].value = '';
		}
	})
	.catch(err => console.log(err))
}