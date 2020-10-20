var gplay = require('google-play-scraper');
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/appPermissions";
let fs = require('fs');
const { ArgumentParser } = require('argparse');
const readline = require("readline");
const { exit } = require('process');
const { create } = require('domain');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

allcategories=['APPLICATION', 'ANDROID_WEAR', 'ART_AND_DESIGN', 'AUTO_AND_VEHICLES', 'BEAUTY', 'BOOKS_AND_REFERENCE', 'BUSINESS', 'COMICS', 'COMMUNICATION',
                'DATING', 'EDUCATION', 'ENTERTAINMENT', 'EVENTS', 'FINANCE', 'FOOD_AND_DRINK', 'HEALTH_AND_FITNESS', 'HOUSE_AND_HOME', 'LIBRARIES_AND_DEMO', 'LIFESTYLE',
                'MAPS_AND_NAVIGATION', 'MEDICAL', 'MUSIC_AND_AUDIO', 'NEWS_AND_MAGAZINES', 'PARENTING', 'PERSONALIZATION', 'PHOTOGRAPHY', 'PRODUCTIVITY', 'SHOPPING', 'SOCIAL',
                'SPORTS', 'TOOLS', 'TRAVEL_AND_LOCAL', 'VIDEO_PLAYERS', 'WEATHER', 'GAME', 'GAME_ACTION', 'GAME_ADVENTURE', 'GAME_ARCADE', 'GAME_BOARD', 'GAME_CARD', 'GAME_CASINO', 
                'GAME_CASUAL', 'GAME_EDUCATIONAL', 'GAME_MUSIC', 'GAME_PUZZLE', 'GAME_RACING', 'GAME_ROLE_PLAYING', 'GAME_SIMULATION', 'GAME_SPORTS', 'GAME_STRATEGY', 'GAME_TRIVIA',
                'GAME_WORD', 'FAMILY', 'FAMILY_ACTION', 'FAMILY_BRAINGAMES', 'FAMILY_CREATE', 'FAMILY_EDUCATION', 'FAMILY_MUSICVIDEO', 'FAMILY_PRETEND']

allcollections=['TOP_FREE', 'TOP_PAID', 'GROSSING', 'TRENDING', 'TOP_FREE_GAMES', 'TOP_PAID_GAMES', 'TOP_GROSSING_GAMES', 'NEW_FREE', 'NEW_PAID', 'NEW_FREE_GAMES', 'NEW_PAID_GAMES']

sorts=['2','3','1']
ages=['AGE_RANGE1','AGE_RANGE2','AGE_RANGE3']

/*
    function: recreateMongoCollection: this function recreates the androidApplications collection in mongo
    Parameters:
        dbo: the current database
    Returns: nothing
    Post-condition: modifies the mongo database
    TODO: Having trouble running this asynchronously. Come back to this maybe.
*/

function recreateMongoCollection(dbo) {
    rl.question('Would you like to drop the current collection and start new?\n1. Yes\n2. No\n', (answer) => {
        if(answer != '1' && answer != '2'){
            console.log("Invalid input");
            exit();
        }
        else if(answer == '1'){
            recreate = true;
            dbo.collection("AndroidApplications").drop(function(err, delOK) {
                if (err){
                    console.log("Collection already deleted")
                }
                if (delOK) console.log("Collection deleted");
                dbo.createCollection("AndroidApplications", function(err, res) {
                    if (err) throw err;
                    console.log("Successfully recreated collection")
                });
            });
        }
        rl.close();
    })
}

/*
    function: createMongoCollection: this function creates the androidApplications collection in mongo
    Parameters:
        dbo: the current database
    Returns: nothing
    Post-condition: modifies the mongo database
*/

function createMongoCollection(dbo) {
    dbo.createCollection("AndroidApplications", function(err, res) {
        if (err){
            //console.log("AndroidApplications collection already exists");
        };
    })
}


/*
    function: get_list: this function calls the gplay.list function, and outputs the response into a json file
    Parameters:
        cat: the category of app to search for. Needs to be one from the list given on the library's notes
        collec: similar to cat, just for the collection part
        count: how many to return

    Returns: nothing
    Post-condition: Data is inserted into a DB
*/
function get_list(cat, collec, count, db) {
    return new Promise(function (resolve, reject) {
        var dbo = db.db("appPermissions");
        createMongoCollection(dbo)

        try{
            resolve(gplay.list( 
            {   
                category: gplay.category[cat],
                collection: gplay.collection[collec],
                num: count
            }
            ).then(function(response){
            /*
            let filename = cat + "_" + collec + "_" + count + '.json';
            console.log(filename);
            fs.writeFile(filename, JSON.stringify(response, null, 2), 'utf8', function(err){
                if(err){
                    console.log(err);
                }
            });
            */
                jsonObj = JSON.parse(JSON.stringify(response, null, 2));
                for(let val in jsonObj){
                    populate(val, dbo, jsonObj, cat)
                }
            }));
        }
        catch{
            console.log("Error with scraper")
        }
        
    });
}

let populate = async function (val, dbo, jsonObj, cat) {

    await dbo.collection("AndroidApplications").find({appId: jsonObj[val]['appId']}).toArray(function(err, result){
        if (result.length != 0){
            console.log(jsonObj[val]['appId'] + " - already exists")
        }
        else{
            obj = {title: jsonObj[val]['title'], appId: jsonObj[val]['appId'], url: jsonObj[val]['url'], 
                developer: jsonObj[val]['developer'], devID: jsonObj[val]['developerId'], price: jsonObj[val]['priceText'],
                price: jsonObj[val]['price'], free: jsonObj[val]['free'], category: cat}
            dbo.collection("AndroidApplications").insertOne(obj, function(err, res){
                if(err) throw err;
                else{
                    console.log("Successfully added: " + jsonObj[val]['appId'])
                }
            })
        }
    })      
}

function main(db) {
    num = 100
    count1 = 0
    count2 = 0
    allcategories.forEach(function(value, index1){
        count1 += 2
        allcollections.forEach(function(value2, index2){
            count2 += 8
            setTimeout(() => {
                console.log("Category: " + value)
                console.log("Collection: " + value2)
                console.log("Count: " + num)
                try {
                    get_list(value, value2, num, db);
                }
                catch (e) {
                    console.log("Error")
                }   
            }, (count1+count2)*1000);
        });
    });
}
const parser = new ArgumentParser({
    description: 'To see varying categories and collections, please visit https://github.com/facundoolano/google-play-scraper/blob/dev/lib/constants.js#L58'
});

parser.add_argument('-c', '--cat', { help: 'Category choice (e.g. COMICS, EDUCATION, etc.)' });
parser.add_argument('-co', '--coll', { help: 'Collection choice (e.g. TOP_FREE, TOP_PAID, etc.)' });
parser.add_argument('-ct', '--count', { help: 'Integer to determine how many results will be gathered' });
mongo.connect(url, function(err, db) {
    if (err) throw err;
    //console.log("Category: " + parser.parse_args()['cat'])
    //console.log("Collection: " + parser.parse_args()['coll'])
    //console.log("Count: " + parser.parse_args()['count'])
    //get_list(parser.parse_args()['cat'], parser.parse_args()['coll'], parser.parse_args()['count'], db).then(process.exit(1));
    main(db)
    //db.close();
});