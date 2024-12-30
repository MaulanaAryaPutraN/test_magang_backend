const routes = require("express").Router();
const db = require("../connect_db");

routes.get("/project", (req, res) => {
  db.query(
    "SELECT code_project, name, description, start_date, end_date FROM projects",
    (error, result) => {
      if (error) {
        res.status(500).send({
          status: "error",
          message: "Failed to get data",
          error: error.message,
        });
      } else {
        res.status(200).send({
          status: "success",
          message: "Successfully get all data project",
          data: result,
        });
      }
    }
  );
});

routes.get("/project/:code_project", (req, res) => {
  const code_project = req.params.code_project;
  db.query(
    `SELECT code_project, name, description ,start_date ,end_date FROM projects WHERE code_project = ${code_project}`,
    (error, result) => {
      if (error) {
        res.status(500).send({
          status: "error",
          message: "Failed to get data",
          error: error.message,
        });
      } else if (result.length === 0) {
        res.status(404).send({
          status: "error",
          message: `project with id ${code_project} not found`,
        });
      } else {
        res.status(200).send({
          status: "success",
          message: "Successfully get data project",
          data: result,
        });
      }
    }
  );
});
routes.post("/project", (req, res) => {
  const { code_project, name, description, start_date, end_date } = req.body;

  if (!code_project || !name || !description || !start_date || !end_date) {
    return res.status(400).send({
      status: "error",
      message: "All fields are required",
    });
  }
  const query = `
                  INSERT INTO projects (code_project, name, description, start_date, end_date) 
                  VALUES (?, ?, ?, ?, ?)
              `;

  db.query(
    query,
    [code_project, name, description, start_date, end_date],
    (error, result) => {
      if (error) {
        return res.status(500).send({
          status: "error",
          message: "Failed to insert project",
          error: error.message,
        });
      }

      res.status(201).send({
        status: "success",
        message: "Project added successfully",
        data: {
          code_project,
          name,
          description,
          start_date,
          end_date,
        },
      });
    }
  );
});
routes.put("/project/:code_project", (req, res) => {
  const { code_project } = req.params;
  const { name, description, start_date, end_date } = req.body;

  const updateProjectQuery = `
                  UPDATE projects
                  SET name = COALESCE(?, name),
                      description = COALESCE(?, description),
                      start_date = COALESCE(?, start_date),
                      end_date = COALESCE(?, end_date)
                  WHERE code_project = ?
              `;

  const values = [name, description, start_date, end_date, code_project];

  db.query(updateProjectQuery, values, (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to update project data",
        error: error.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        status: "error",
        message: "Project not found",
      });
    }

    res.status(200).send({
      status: "success",
      message: "Project data updated successfully",
      data: {
        code_project,
        name: name || result.name,
        description: description || result.description,
        start_date: start_date || result.start_date,
        end_date: end_date || result.end_date,
      },
    });
  });
});
routes.delete("/project/:code_project", (req, res) => {
  const { code_project } = req.params;
  const checkProjectQuery =
    "SELECT code_project FROM projects WHERE code_project = ?";
  db.query(checkProjectQuery, [code_project], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to check project",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "Project not found",
      });
    }

    const deleteProjectQuery = "DELETE FROM projects WHERE code_project = ?";
    db.query(
      deleteProjectQuery,
      [code_project],
      (deleteError, deleteResult) => {
        if (deleteError) {
          return res.status(500).send({
            status: "error",
            message: "Failed to delete project",
            error: deleteError.message,
          });
        }

        res.status(200).send({
          status: "success",
          message: "Project deleted successfully",
        });
      }
    );
  });
});
module.exports = routes;
