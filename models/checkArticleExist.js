module.exports = {
	found: (row, results) => {
		for (r of results) {
			if (row.id == r.id)
				return 1;
		}
		return 0;
	},
	allArticles: (row, allArticles) => {
		for (let i = 0; i < allArticles.length; i++) {
			if (row.id == allArticles[i])
				allArticles.splice(i, 1);
		}
	}
}