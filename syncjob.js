
var converter = require('html-to-json');
var request = require('request');
var csvToJson = require('convert-csv-to-json');

var database = require('./routes/data/mongodb')
var Series = require('./routes/async');


var decklistParser = converter.createParser(['.deck-tile', {
    name: function ($a) {
        return $a.find('.deck-price-paper a').text();
    },
    id: function ($a) {
        return $a.find('.deck-price-paper a').attr("href").replace("/deck/", "").replace("#paper", "");
    },
    url: function ($a) {
        return "https://www.mtggoldfish.com" + $a.find('.deck-price-paper a').attr("href").replace("#paper", "");
    },
    exporturl: function ($a) {
        return "https://www.mtggoldfish.com" + $a.find('.deck-price-paper a').attr("href").replace("deck", "deck/download").replace("#paper", "");
    },
}]);





var series = new Series();
decklistParser.request('https://www.mtggoldfish.com/deck/custom/commander?page=1#paper').done(function (fetched) {

    var ids = fetched.map(function (element) { return element.id })
    database.removeExisting(ids, function (newDeckIds) {
        var decks = fetched.filter(function (fetch) {
            return newDeckIds.includes(fetch.id)
        })

        series.then(function (done) {
            done({
                fetched: ids,
                new: newDeckIds
            })
        })


        decks.forEach(function (deck) {
            series.then(function (done) {
                request(deck.exporturl, function (error, response, body) {
                    deck.list = body.split("\r\n").map(function (row) {
                        var count = row.split(" ")[0]
                        var name = row.replace(count + " ", "")
                        var scryfall = "https://api.scryfall.com/cards/named?exact=" + name
                        return {
                            count: count,
                            name: name,
                            detail: scryfall
                        }
                    }).filter(function (element) {
                        return element.count != ""
                    })
                    database.insert(deck, function () {
                        done(deck);
                    })

                });
            });
        });
        series.async(function (results) {
            console.log(results);
        });
    })
});




