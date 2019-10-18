module.exports = {
	found: (row, results) => {
		for (r of results) {
			if (row.id == r.id)
				return 1;
		}
		return 0;
	},
	allArticles: (row, newArticles) => {
		for (let i = 0; i < newArticles.length; i++) {
			if (row.id == newArticles[i].id){
				newArticles.splice(i, 1);
			}
		}
	}
}
