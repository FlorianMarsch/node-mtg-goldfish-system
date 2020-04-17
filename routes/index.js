var express = require('express');
var router = express.Router();
var converter = require('html-to-json');
var Series = require('./async');
var request = require('request');
var csvToJson = require('convert-csv-to-json');

module.exports = function () {

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



    router.get('/api/decks', function (req, res) {


        var series = new Series();
        decklistParser.request('https://www.mtggoldfish.com/deck/custom/commander?page=1#paper').done(function (decks) {
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
                        done(deck);
                    });
                });
            });
            series.async(function (results) {
                res.send(results);
            });
        });

    });


    return router;
}