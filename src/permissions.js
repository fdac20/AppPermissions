var gplay = require('google-play-scraper');

/* function get_permissions: this functions takes the appID given, then outputs said apps permissions
    Parameters:
        id: the appID used for the gplay api
    Returns nothing
    Post-condition: data is inserted into the DB
*/
function get_permissions(id){
    gplay.permissions(
        {
            appId: id
        }
    ).then(function(response){
        // insert the data into DB here
        get_appp_info(id, response);
    });
};

function get_appp_info(id, perm_response){
    gplay.app(
        {
            appId: id
        }
    ).then(function(response){
        // database injection here!
        console.log("permissions");
        console.log(perm_response);
        console.log("app info");
        console.log(response);
    });
}

get_permissions(process.argv[2]);