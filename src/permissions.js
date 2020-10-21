var gplay = require('google-play-scraper');
const { Z_NEED_DICT } = require('zlib');
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/appPermissions";

/* function get_permissions: this functions takes the appID given, then outputs said apps permissions
    Parameters:
        id: the appID used for the gplay api
    Returns nothing
    Post-condition: data is inserted into the DB
*/
function get_permissions(db, doc){
    gplay.permissions(
        {
            appId: doc['appId']
        }
    ).then(async function(response){
        // insert the data into DB here
        var permissions = {}
        for await (const permission of response){
            exists = false
            index = 0
            if (permission['type'] in permissions) {
                permissions[permission['type']].push(permission['permission'])
            }
            else{
                permissions[permission['type']] = new Array();
                permissions[permission['type']].push(permission['permission'])
            }
        }
        query = {appId: doc['appId']}
        newval = {$set: {permissions: permissions}}
        db.collection("AndroidApplications").updateOne(query, newval, function(err, res) {
            if (err) throw err;
            console.log(doc['appId'] + "document updated with permissions");
        });
    });
};

function get_app_info(db, doc){
    gplay.app(
        {
            appId: doc['appId']
        }
    ).then(function(response){
        // database injection here!
        query = {appId: doc['appId']}
        newval = {$set: {installs: response['installs']}}
        db.collection("AndroidApplications").updateOne(query, newval, function(err, res) {
            if (err) throw err;
            console.log(doc['appId'] + " document updated with installs");
        });
    });
}


function main(db) {
    query = {"installs" : {$exists : false}}
    db.collection("AndroidApplications").find(query, async function(err, doc){
        if (err) throw err
        count1 = 1
        for await (const prop of doc) {
            setTimeout(function(){
                get_app_info(db, prop);
            }, count1 * 50)
            count1 += 2 
        };
    })
    
    /*
    for await (const doc of cursor){
        get_app_info(db, doc);
    }
    */

}

mongo.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("appPermissions")
    //console.log("Category: " + parser.parse_args()['cat'])
    //console.log("Collection: " + parser.parse_args()['coll'])
    //console.log("Count: " + parser.parse_args()['count'])
    //get_list(parser.parse_args()['cat'], parser.parse_args()['coll'], parser.parse_args()['count'], db).then(process.exit(1));
    main(dbo)
    //db.close();
});