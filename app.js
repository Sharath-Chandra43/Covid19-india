const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () =>
      console.log("Server Running at http://localhost:3001/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  const result = await database.get(getMovieQuery);
  response.send(convertStateDbObjectToResponseObject(result));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (district_name, state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId},${cases},${cured},${active},${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id='${districtId}';`;
  const districtArray = await database.get(getDistrictsQuery);
  response.send(convertDistrictDbObjectToResponseObject(districtArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteMovieQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictsQuery = `
            UPDATE
              district
            SET
              district_name ='${districtName}',
              state_id = ${stateId},
              cases = ${cases},
              cured = ${cured},
              active = ${active},
              deaths = ${deaths}
            WHERE
              district_id = ${districtId};`;

  await database.run(updateDistrictsQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    Where
      state_id=${stateId};`;
  const stats = await database.get(getStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeath: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT
     state_name
    FROM
     district NATURAL JOIN state
    WHERE
      district_id = ${districtId};`;
  const stateName = await database.all(getStateName);
  response.send(convertStateDbObjectToResponseObject(stateName));
});

module.exports = app;
