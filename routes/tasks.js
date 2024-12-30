const routes = require("express").Router();
const db = require("../connect_db");

routes.get("/task", (req, res) => {
  const query = `
                  SELECT
                      tasks.code_task, 
                      tasks.name, 
                      tasks.description, 
                      tasks.due_date, 
                      tasks.status, 
                      users.name AS user_name, 
                      projects.name AS project_name
                  FROM tasks
                  INNER JOIN users ON tasks.id_user = users.id
                  INNER JOIN projects ON tasks.id_project = projects.id
              `;

  db.query(query, (error, result) => {
    if (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to get data",
        error: error.message,
      });
    } else {
      res.status(200).send({
        status: "success",
        message: "Successfully retrieved all tasks with user and project names",
        data: result,
      });
    }
  });
});
routes.get("/task/:code_task", (req, res) => {
  const code_task = req.params.code_task;
  const query = `
                  SELECT
                      tasks.code_task, 
                      tasks.name, 
                      tasks.description, 
                      tasks.due_date, 
                      tasks.status, 
                      users.name AS user_name, 
                      projects.name AS project_name
                  FROM tasks
                  INNER JOIN users ON tasks.id_user = users.id
                  INNER JOIN projects ON tasks.id_project = projects.id
                  WHERE tasks.code_task = ${code_task}
              `;

  db.query(query, (error, result) => {
    if (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to get data",
        error: error.message,
      });
    } else if (result.length === 0) {
      res.status(404).send({
        status: "not_found",
        message: `Task with id ${code_task} not found`,
      });
    } else {
      res.status(200).send({
        status: "success",
        message: "Successfully retrieved task data",
        data: result,
      });
    }
  });
});

routes.post("/task", (req, res) => {
  const {
    code_task,
    id_user,
    id_project,
    name,
    description,
    due_date,
    status,
  } = req.body;

  if (
    !code_task ||
    !id_user ||
    !id_project ||
    !name ||
    !description ||
    !due_date ||
    !status
  ) {
    return res.status(400).send({
      status: "error",
      message: "All fields are required",
    });
  }

  const checkUserQuery = "SELECT id FROM users WHERE id = ?";
  db.query(checkUserQuery, [id_user], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to check user",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    const checkProjectQuery = "SELECT id FROM projects WHERE id = ?";
    db.query(checkProjectQuery, [id_project], (error, result) => {
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

      const query = `
                          INSERT INTO tasks (code_task, id_user, id_project, name, description, due_date, status)
                          VALUES (?, ?, ?, ?, ?, ?, ?)
                      `;

      const values = [
        code_task,
        id_user,
        id_project,
        name,
        description,
        due_date,
        status,
      ];

      db.query(query, values, (error, result) => {
        if (error) {
          return res.status(500).send({
            status: "error",
            message: "Failed to add task",
            error: error.message,
          });
        }

        res.status(201).send({
          status: "success",
          message: "Task added successfully",
          data: {
            code_task,
            id_user,
            id_project,
            name,
            description,
            due_date,
            status,
          },
        });
      });
    });
  });
});
routes.put("/task/:code_task", (req, res) => {
  const { code_task } = req.params;
  const { id_user, id_project, name, description, due_date, status } = req.body;

  if (!code_task) {
    return res.status(400).send({
      status: "error",
      message: "Task code is required",
    });
  }

  function updateTask() {
    const updateTaskQuery = `
                      UPDATE tasks
                      SET id_user = COALESCE(?, id_user),
                          id_project = COALESCE(?, id_project),
                          name = COALESCE(?, name),
                          description = COALESCE(?, description),
                          due_date = COALESCE(?, due_date),
                          status = COALESCE(?, status)
                      WHERE code_task = ?
                  `;

    const values = [
      id_user,
      id_project,
      name,
      description,
      due_date,
      status,
      code_task,
    ];

    db.query(updateTaskQuery, values, (error, result) => {
      if (error) {
        return res.status(500).send({
          status: "error",
          message: "Failed to update task data",
          error: error.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({
          status: "error",
          message: "Task not found",
        });
      }

      res.status(200).send({
        status: "success",
        message: "Task data updated successfully",
        data: {
          code_task,
          id_user: id_user || result.id_user,
          id_project: id_project || result.id_project,
          name: name || result.name,
          description: description || result.description,
          due_date: due_date || result.due_date,
          status: status || result.status,
        },
      });
    });
  }

  if (id_user) {
    const checkUserQuery = "SELECT id FROM users WHERE id = ?";
    db.query(checkUserQuery, [id_user], (userError, userResult) => {
      if (userError) {
        return res.status(500).send({
          status: "error",
          message: "Failed to check user",
          error: userError.message,
        });
      }

      if (userResult.length === 0) {
        return res.status(404).send({
          status: "error",
          message: "User not found",
        });
      }

      if (id_project) {
        const checkProjectQuery = "SELECT id FROM projects WHERE id = ?";
        db.query(
          checkProjectQuery,
          [id_project],
          (projectError, projectResult) => {
            if (projectError) {
              return res.status(500).send({
                status: "error",
                message: "Failed to check project",
                error: projectError.message,
              });
            }

            if (projectResult.length === 0) {
              return res.status(404).send({
                status: "error",
                message: "Project not found",
              });
            }
            updateTask();
          }
        );
      } else {
        updateTask();
      }
    });
  } else if (id_project) {
    const checkProjectQuery = "SELECT id FROM projects WHERE id = ?";
    db.query(checkProjectQuery, [id_project], (projectError, projectResult) => {
      if (projectError) {
        return res.status(500).send({
          status: "error",
          message: "Failed to check project",
          error: projectError.message,
        });
      }

      if (projectResult.length === 0) {
        return res.status(404).send({
          status: "error",
          message: "Project not found",
        });
      }
      updateTask();
    });
  } else {
    updateTask();
  }
});
routes.delete("/task/:code_task", (req, res) => {
  const { code_task } = req.params;
  const checkTaskQuery = "SELECT code_task FROM tasks WHERE code_task = ?";
  db.query(checkTaskQuery, [code_task], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to check task",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "Task not found",
      });
    }

    const deleteTaskQuery = "DELETE FROM tasks WHERE code_task = ?";
    db.query(deleteTaskQuery, [code_task], (deleteError, deleteResult) => {
      if (deleteError) {
        return res.status(500).send({
          status: "error",
          message: "Failed to delete task",
          error: deleteError.message,
        });
      }

      res.status(200).send({
        status: "success",
        message: "Task deleted successfully",
      });
    });
  });
});
module.exports = routes;
