





var MongoClient = require('mongodb').MongoClient;
var url = process.env.MONGODB_URI || "mongodb://localhost:27017/";

var database = url.split("/")[3]


module.exports = {
    removeExisting: function (ids, callback) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                callback([])
                return
            }
            var dbo = db.db(database);
            dbo.collection("decks").find({
                "id": { $in: ids }
            }).toArray(function (err, result) {
                if (err) throw err;
                db.close();

                var existing = result.map(function (element) {
                    return element.id
                })
                callback(ids.filter(function (item) {
                    return !existing.includes(item);
                }))
            });
        });
    },
    insert: function (myobj, callback) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                callback()
                return
            }
            var dbo = db.db(database);
            myobj.date = new Date();
            dbo.collection("decks").insertOne(myobj, function (err, res) {
                db.close();
                callback()
            });
        });
    }
}