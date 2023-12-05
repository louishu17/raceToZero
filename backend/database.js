const sqlite3 = require("sqlite3").verbose();

function getEmissionReduction(solutionName, callback) {
  console.log("Searching for solution:", solutionName); // Debugging
  const db = new sqlite3.Database("solutions_db.sqlite");
  const query = "SELECT CO2eq FROM solutions WHERE solution = ?";

  db.get(query, [solutionName], (err, row) => {
    if (err) {
      console.error("Database error:", err); // Log errors
      callback(err, null);
    } else {
      if (row) {
        console.log("Solution found:", row); // Log the found row
        callback(null, row.CO2eq);
      } else {
        console.log("Solution not found in the database for:", solutionName); // Log not found
        callback(null, null);
      }
    }
    db.close();
  });
}
function getAllSolutions(callback) {
  const db = new sqlite3.Database("solutions_db.sqlite");
  db.all("SELECT solution, CO2eq FROM solutions", [], (err, rows) => {
    db.close();
    if (err) {
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

module.exports = {
  getEmissionReduction,
  getAllSolutions,
};
