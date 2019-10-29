// Delete comment
const deleteComment = (btn) => {
    const comment_id = btn.parentNode.querySelector('[name="comment_id"]').value;
    fetch('deleteComment?id=' + comment_id, {
        method: 'DELETE'
    })
    .then(result => {
        // Remove comment
        btn.parentNode.parentNode.parentNode.remove();
        // Decrease quantity comment
        const numComment = document.querySelector('#numComment');
        numComment.textContent = +numComment.textContent - 1;
        alert('Đã xoá bình luận thành công!');
    })
    .catch(err => console.log(err));
}

// Edit Comment
const editComment = (btn, admin_id) => {
    const actionComment = btn.parentNode.parentNode//.childNodes[2].nextSibling;
    const areaComment = actionComment.parentNode;
    const article_id = areaComment.childNodes[0].nextSibling.id;
    const contentComment = areaComment.childNodes[2].nextSibling.textContent.trim();
console.log(admin_id);
    //
    const commentEditBox = `
        <div class="form-group text-right">
            <textarea onkeypress="enterEditComment(this, event)" class="form-control" name="eidtContent" rows="4" placeholder="Nhập nội dung bình luận ..." maxlength="300">${contentComment}</textarea>
            <input type="hidden" name="admin_id" value="${admin_id}">
            <span>
                <b>----------Chỉnh sửa bình luận----------</b>
                <input id="cancelEditComment" onClick="cancelEditComment(this, ${article_id})" class="btn btn-warning" style="margin: 10px 0" type="button" value="Huỷ"/>
                <input id="enterEditComment" onClick="postEditComment(this, ${article_id})" class="btn btn-success" style="margin: 10px 0" type="button" value="Cập nhật"/>
            </span>
        </div>
    `
    areaComment.insertAdjacentHTML('afterend', commentEditBox);
    areaComment.hidden = true;
}

// Enter edit comment
function enterEditComment (i, e) {
    if (e.keyCode == 10 || e.keyCode == 13) {
        e.preventDefault();
        i.disabled = true;
        document.querySelector('#enterEditComment').click();
        document.querySelector('#enterEditComment').disabled = true;
        document.querySelector('#cancelEditComment').disabled = true;
    }
}

// Post edit comment
function postEditComment (btn, id) {
    const editedContent = btn.parentNode.parentNode.childNodes[0].nextSibling.value;
    const admin_id = btn.parentNode.parentNode.childNodes[3].value;
    fetch(`editComment?id=${id}&admin_id=${admin_id}`, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({editedContent: editedContent})
    })
    .then(result => {
        // Do something
        if (result.status == 200) {
            // Update comment's content box
            const actionComment = document.getElementById(id)
            const areaComment = actionComment.parentNode;
            moment.locale('vi');
            actionComment.childNodes[2].nextSibling.innerHTML = moment(Date.now()).calendar() + '<sub>Đã chỉnh sửa<sub>';
            areaComment.childNodes[2].nextSibling.innerHTML = '&emsp;&emsp;' + editedContent;
            areaComment.hidden = false;
            btn.parentNode.parentNode.remove();
        }
    })
    .catch(err => console.log(err))
}

// Cancel edit comment
function cancelEditComment (e, id) {
    e.parentNode.parentNode.remove();
    document.getElementById(id).parentNode.hidden = false;
}

// Insert comment
const insertComment = (btn) => {
    const textAreaComment = btn.parentNode.parentNode.querySelector('[name="commentContent"]');
    const content = textAreaComment.value;
    if (content == '') {
        textAreaComment.focus();
        return;
    }
    const id = btn.parentNode.parentNode.querySelector('[name="article_id"]').value;
    const admin_id = btn.parentNode.parentNode.querySelector('[name="admin_id"]').value;
    fetch(`binhluan?id=${id}&admin_id=${admin_id}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({commentContent: content})
    })
    .then(result => {
        return result.json();
    })
    .then(comment => {
        moment.locale('vi');
        const newComment = `
            <div class="containerct">
                <p id="${comment.id}">
                    <span style="color: orange;">${comment.fullname}</span>
                    <i>${moment(comment.date).calendar()}</i>
                    <sup>
                        <input type="hidden" name="comment_id" value="${comment.id}">
                        <button class="btn btn-link" onClick="deleteComment(this)">Xóa</button> ||
                        <button class="btn btn-link" onclick="editComment(this, ${admin_id})">Chỉnh sửa</button>
                    </sup>
                </p>
                <p style="padding: 0 20px">&emsp;&emsp;${comment.content}</p>
            </div>
        `
        // Set empty and focus text box
        textAreaComment.value = '';
        textAreaComment.parentNode.insertAdjacentHTML('beforebegin', newComment);
        textAreaComment.disabled = false;
        textAreaComment.focus();
        // Increase quantity comment
        const numComment = document.querySelector('#numComment');
        numComment.textContent = +numComment.textContent + 1;
        // Enable button post comment
        btn.disabled = false;
    })
    .catch(err => console.log(err))
}

void function triggerButtonClick () {
    const textAreaComment = document.querySelector('[name="commentContent"]')
    if (textAreaComment) {
        textAreaComment.addEventListener('keypress', (e) => {
            if (e.keyCode === 10 || e.keyCode === 13) {
                e.preventDefault();
                const bntInsert = document.querySelector('#btnInsertComment');
                bntInsert.click();
                // Disable button post comment
                textAreaComment.disabled = true;
                bntInsert.disabled = true;
            }
        })
    }
}()

function save (e) {
    const id = e.parentNode.querySelector('[name="article_id"]').value;
    const code = e.dataset.save;
    if (code != 1) {
        // Save article
        fetch('save?id=' + id)
        .then(result => {
            if (result.status == 200) {
                e.textContent = 'Đã lưu';
                e.dataset.save = 1;
                alert('Đã lưu bài viết!')
            }
        })
        .catch(err => console.log(err))
    } else {
        // unsave
        fetch('unsave?id=' + id)
        .then(result => {
            if (result.status == 200) {
                e.textContent = 'Lưu bài viết';
                e.dataset.save = 0;
                alert('Đã huỷ lưu bài viết!')
            }
        })
        .catch(err => console.log(err))
    }
}
