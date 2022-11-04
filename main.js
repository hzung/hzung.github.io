var googleSpreadSheetId = "1nGnC3swMxl0n-nkkqHKxfnp4zDMlTAylVYvq5D8tRzA";
var apiKey = "AIzaSyD3_rrZTCSgt5vbqdKm5wJY6bl_rSI2R3w";
new Vue({
    el: '#app',
    data: {
        terms: [],
        quotes: [],
        quote: null,
        articles: [],
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
            var results = (this.searchAticles != "" ? this.fuseArticles.search(this.searchAticles).map(item => item.item) : this.articles).sort(sortViews).slice(0, 500);
            results = results.filter(article => {
                return article.topic in vm.topics && vm.topics[article.topic].checked;
            });
            return results;
        },
        topicsArr: function() {
            return Object.keys(this.topics);
        }
    },
    methods: {
        randomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        fetchAbbr() {
            var vm = this;
            var url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSpreadSheetId + "/values/Terms!A:B?alt=json&key=" + apiKey;
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
        fetchQuotes() {
            var vm = this;
            var url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSpreadSheetId + "/values/Quotes!A:B?alt=json&key=" + apiKey;
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
            })
        }
    },
    created() {
        var vm = this;
        vm.fetchAbbr();
        vm.fetchQuotes();
        axios.get('https://raw.githubusercontent.com/hzung/hzung.github.io/main/Al-Trade-Setups.json').then(response => {
            vm.articles = response.data;
            var topics = {};
            vm.articles.forEach(article => {
                if (!(article.topic in topics)) {
                    topics[article.topic] = {
                        amount: 1,
                        checked: article.topic == "Al's Trade Setups" ? true : false
                    }
                } else {
                    topics[article.topic]['amount'] += 1;
                }
            });
            vm.topics = topics;
            vm.articles = vm.articles.map(article => {
                article.shortTopic = article.topic.split(' ').map(item => (item[0] + "").toUpperCase()).join('');
                return article;
            });
            vm.fuseArticles = new Fuse(vm.articles, {
                includeScore: true,
                keys: ['name', 'topic']
            });
        })
    }
})