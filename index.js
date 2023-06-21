'use strict';

const fetch = require('node-fetch');
const fs = require('fs');
const uri_api = "https://chalmers-research-publications-prod.azurewebsites.net/api/Publications";
const output_file = "./output/all_research_data.json";

console.log("Fetches all publications from research.chalmers.se public API and writes to JSON file.");
console.log("Pages results with start and max parameters.");

async function fetch_partial_result(start, max) {
    console.time('fetch_command')
    const uri = `${uri_api}?query=_exists_%3AId&max=${max}&start=${start}&sort=Year&sortOrder=desc&selectedFields=Id%2CTitle%2CYear%2CPersons.PersonData.IdentifierCid%2CPersons.PersonData.DisplayName%2CPersons.Organizations.OrganizationData.IdentifierLdapCode%2CPersons.Organizations.OrganizationData.DisplayPathShortEng%2CPersons.Organizations.OrganizationData.DisplayPathShortSwe%2CDetailsUrlEng%2CDetailsUrlSwe%2CIdentifierCplPubid%2CPublicationType%2CSource`;
    const response = await fetch(uri);
    const data = await response.json();
    console.timeEnd('fetch_command')
    return data;
}

var totalCount = 0;
var start = 0;
var max = 10000;
var publications = [];

const data = fetch_partial_result(0, 0).then(async (json) => {
    totalCount = json.TotalCount;

    console.log("Publications in total: " + totalCount);
    console.time('publications_all');

    while (start <= totalCount) {
        console.time('segment');
        const partial = await fetch_partial_result(start, max).then(async (pjson) => {
            for (const p of pjson.Publications) {
                publications.push(p);
            }

            start = start + max;

            console.log("Current number of fetched publications: " + publications.length);
            console.log("start = " + start);

            if (start >= totalCount) {
                console.log("All publications fetched. Publications in array: " + publications.length + ", diff: " + (totalCount - publications.length))
                console.timeEnd('publications_all');

                try {
                    console.log("Writing JSON to " + output_file);
                    fs.writeFileSync(output_file, JSON.stringify(publications));
                } catch (err) {
                    console.error(err);
                }
            }
        });

        console.timeEnd('segment');
    }
});
