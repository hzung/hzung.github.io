var googleSpreadSheetId = "1nGnC3swMxl0n-nkkqHKxfnp4zDMlTAylVYvq5D8tRzA";
var apiKey = "jlnao90dP1GasdnYxlWM5pGV21kMrZTbtskWw8Ua2g3Q5NVY6lUQ";

function reverse(s){
    return s.split("").reverse().join("");
}
var decodedApiKey = atob(reverse(apiKey));

Vue.use(VueMarkdown);
new Vue({
    el: '#app',
    data: {
        terms: [],
        quotes: [],
        quote: null,
        randomQuoteIndex: 0,
        articles: [],
        articlesObj: {},
        isFilterFavoriteOnly: false,
        topics: {},
        searchText: '',
        searchAticles: '',
        fuseTerms: null,
        fuseArticles: null,
        sortBy: 'views'
    },
    computed: {
        filterTerms: function () {
            var randomIndex = this.randomInteger(0, this.terms.length - 1);
            return this.searchText != "" ? this.fuseTerms.search(this.searchText).map(item => item.item).slice(0, 3) : [this.terms[randomIndex]];
        },
        filterArticles: function () {
            var vm = this;
            function sortViews(a, b) {
                if ( a[vm.sortBy] < b[vm.sortBy] ){
                    return 1;
                    }
                    if ( a[vm.sortBy] > b[vm.sortBy] ){
                    return -1;
                    }
                    return 0;
            }
            if (vm.isFilterFavoriteOnly) {
                return vm.favoriteArticles;
            } else {
                var results = this.articles.filter(article => {
                    return article.topic in vm.topics && vm.topics[article.topic].checked && article.replies > 0;
                });
                results = this.searchAticles != "" ? this.fuseArticles.search(this.searchAticles).map(item => item.item) : results.sort(sortViews);
                results = results.slice(0, 500);
                return results;
            }
        },
        topicsArr: function() {
            return Object.keys(this.topics);
        },
        favoriteArticles() {
            return this.articles.filter(article => article.isFavorite);
        }
    },
    methods: {
        onClickNext() {
            var vm = this;
            vm.randomQuoteIndex = (vm.randomQuoteIndex + 1) % vm.quotes.length;
            vm.quote = vm.quotes[vm.randomQuoteIndex];
        },
        randomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        fetchAbbr() {
            var vm = this;
            var url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSpreadSheetId + "/values/Terms!A:B?alt=json&key=" + decodedApiKey;
            axios.get(url).then(response => {
                vm.terms = response.data.values.map(item => {
                    return {
                        "title": item[0],
                        "content": item[1]
                    }
                });
                vm.terms.shift();
                vm.fuseTerms = new Fuse(vm.terms, {
                    includeScore: true,
                    keys: ['title', 'content']
                });
            })
        },
        randomQuoteAuto(){ 
            var vm = this;
            vm.randomQuoteIndex = vm.randomInteger(0, vm.quotes.length - 1);
            setInterval(() => {
                vm.randomQuoteIndex = (vm.randomQuoteIndex + 1) % vm.quotes.length;
                vm.quote = vm.quotes[vm.randomQuoteIndex];
            }, 30000);
        },
        fetchQuotes() {
            var vm = this;
            var url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSpreadSheetId + "/values/Quotes!A:B?alt=json&key=" + decodedApiKey;
            axios.get(url).then(response => {
                vm.quotes = response.data.values.map(item => {
                    return {
                        "content": item[0],
                        "link": item[1]
                    }
                });
                vm.quotes.shift();
                var randomIndex = vm.randomInteger(0, vm.quotes.length - 1);
                vm.quote = vm.quotes[randomIndex];
                vm.randomQuoteAuto();
            })
        },
        toggleFavorite(article) {
            article.isLoadingFavorite = true;
            var url = "https://script.google.com/macros/s/AKfycbx_GoH0KMnQyDj5gXOJZxdoFThht3Sy5LYap6N1LiB2L7nzVnFeixdbDGO0m5V_FKfY/exec";
            var formdata = new FormData();
            formdata.append("link", article.url);
            formdata.append("sheet", "Favorites");
            axios.post(url, formdata).then(response => {
                article.isLoadingFavorite = false;
                article.isFavorite = !article.isFavorite;
            })
        },
        getFavoriteArticles(callback) {
            var url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSpreadSheetId + "/values/Favorites!A:A?alt=json&key=" + decodedApiKey;
            axios.get(url).then(response => {
                if (typeof(response.data.values) == 'undefined') {
                    callback({});
                } else {
                    var favoriteUrls = response.data.values.map(item => item[0]);
                    var favoriteObj = {};
                    favoriteUrls.forEach(item => {
                        favoriteObj[item] = true;
                    });
                    callback(favoriteObj);
                }
            })
        }
    },
    created() {
        var vm = this;
        vm.fetchAbbr();
        vm.fetchQuotes();
        axios.get('https://raw.githubusercontent.com/hzung/hzung.github.io/main/Al-Trade-Setups.json').then(response => {
            var articlesResponse = response.data;
            // Get favorites
            vm.getFavoriteArticles((favoriteObj) => {
                var topics = {};
                articlesResponse.forEach(article => {
                    if (article.replies > 0) {
                        if (!(article.topic in topics)) {
                            topics[article.topic] = {
                                amount: 1,
                                checked: article.topic == "Al's Trade Setups" ? true : false
                            }
                        } else {
                            topics[article.topic]['amount'] += 1;
                        }
                    }
                });
                vm.topics = topics;
                articlesResponse.forEach(article => {
                    vm.articlesObj[article.url] = article;
                });
                vm.articles = articlesResponse.map(article => {
                    article.shortTopic = article.topic.split(' ').map(item => (item[0] + "").toUpperCase()).join('');
                    article.isFavorite = article.url in favoriteObj;
                    article.isLoadingFavorite = false;
                    return article;
                });
                vm.fuseArticles = new Fuse(vm.articles, {
                    includeScore: true,
                    keys: ['name']
                });
            });
        })
    }
})