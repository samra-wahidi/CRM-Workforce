from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from models import db, User, Attendance, Task, Project
from datetime import datetime
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from config import Config
from models import db, User
from sqlalchemy import func

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

CORS(app, origins=[
    "http://localhost:5173",
    "https://crm-frontend.onrender.com"
])
with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return {"message": "Workforce CRM Backend Running"}


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "Employee")
    department = data.get("department")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        name=name,
        email=email,
        password=hashed_password,
        role=role,
        department=department
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    if not bcrypt.check_password_hash(user.password, password):
        return jsonify({
            "error": "Invalid credentials"
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "email": user.email
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200    

@app.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()

    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user": user.to_dict(),
        "claims": claims
    }), 200
@app.route("/attendance/checkin", methods=["POST"])
@jwt_required()
def check_in():

    current_user_id = int(get_jwt_identity())

    existing = Attendance.query.filter_by(
        user_id=current_user_id,
        date=datetime.utcnow().date()
    ).first()

    if existing:
        return jsonify({
            "message": "Already checked in today"
        }), 400

    attendance = Attendance(
        user_id=current_user_id,
        check_in=datetime.utcnow()
    )

    db.session.add(attendance)
    db.session.commit()

    return jsonify({
        "message": "Check-in successful",
        "check_in_time": attendance.check_in
    }), 201
@app.route("/attendance/checkout", methods=["POST"])
@jwt_required()
def check_out():
    current_user_id = int(get_jwt_identity())

    attendance = Attendance.query.filter_by(
        user_id=current_user_id,
        date=datetime.utcnow().date()
    ).first()

    if not attendance:
        return jsonify({
            "message": "You have not checked in today"
        }), 400

    if attendance.check_out:
        return jsonify({
            "message": "Already checked out today"
        }), 400

    attendance.check_out = datetime.utcnow()

    total_seconds = (
        attendance.check_out - attendance.check_in
    ).total_seconds()

    attendance.total_hours = round(
        total_seconds / 3600,
        2
    )

    db.session.commit()

    return jsonify({
        "message": "Check-out successful",
        "check_out_time": attendance.check_out,
        "total_hours": attendance.total_hours
    }), 200
@app.route("/attendance/history", methods=["GET"])
@jwt_required()
def attendance_history():
    current_user_id = int(get_jwt_identity())

    records = Attendance.query.filter_by(
        user_id=current_user_id
    ).all()

    history = []

    for record in records:
        history.append({
            "date": str(record.date),
            "check_in": record.check_in,
            "check_out": record.check_out,
            "total_hours": record.total_hours,
            "status": record.status
        })

    return jsonify(history), 200

@app.route("/tasks", methods=["POST"])
@jwt_required()
def create_task():

    current_user_id = int(get_jwt_identity())

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    assigned_to = data.get("assigned_to")
    priority = data.get("priority", "Medium")
    deadline = data.get("deadline")

    if not title or not assigned_to:
        return jsonify({
            "message": "Title and assigned_to are required"
        }), 400

    task = Task(
        title=title,
        description=description,
        assigned_to=assigned_to,
        assigned_by=current_user_id,
        priority=priority,
        deadline=datetime.strptime(
            deadline,
            "%Y-%m-%d"
        ) if deadline else None
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "message": "Task created successfully",
        "task_id": task.id
    }), 201
@app.route("/tasks", methods=["GET"])
@jwt_required()
def get_tasks():

    current_user_id = int(get_jwt_identity())

    tasks = Task.query.filter_by(
        assigned_to=current_user_id
    ).all()

    result = []

    for task in tasks:
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "priority": task.priority,
            "status": task.status,
            "deadline": task.deadline
        })

    return jsonify(result), 200

@app.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):

    current_user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        assigned_to=current_user_id
    ).first()

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    data = request.get_json()

    task.status = data.get(
        "status",
        task.status
    )

    db.session.commit()

    return jsonify({
        "message": "Task updated successfully"
    }), 200

@app.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():

    current_user_id = int(get_jwt_identity())

    total_employees = User.query.count()

    present_today = Attendance.query.filter_by(
        date=datetime.utcnow().date()
    ).count()

    total_tasks = Task.query.filter_by(
        assigned_to=current_user_id
    ).count()

    completed_tasks = Task.query.filter_by(
        assigned_to=current_user_id,
        status="Completed"
    ).count()

    pending_tasks = Task.query.filter(
        Task.assigned_to == current_user_id,
        Task.status != "Completed"
    ).count()

    attendance_count = Attendance.query.filter_by(
        user_id=current_user_id
    ).count()

    attendance_percentage = min(
        round((attendance_count / 30) * 100, 2),
        100
    )

    task_completion_score = (
        (completed_tasks / total_tasks) * 100
        if total_tasks > 0 else 0
    )

    performance_score = round(
        (attendance_percentage * 0.4) +
        (task_completion_score * 0.6),
        2
    )

    return jsonify({
        "total_employees": total_employees,
        "present_today": present_today,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "attendance_percentage": attendance_percentage,
        "performance_score": performance_score
    }), 200
@app.route("/leaderboard", methods=["GET"])
@jwt_required()
def leaderboard():

    users = User.query.all()

    leaderboard_data = []

    for user in users:

        attendance_count = Attendance.query.filter_by(
            user_id=user.id
        ).count()

        total_tasks = Task.query.filter_by(
            assigned_to=user.id
        ).count()

        completed_tasks = Task.query.filter_by(
            assigned_to=user.id,
            status="Completed"
        ).count()

        attendance_score = min(
            (attendance_count / 30) * 100,
            100
        )

        task_score = (
            (completed_tasks / total_tasks) * 100
            if total_tasks > 0 else 0
        )

        performance_score = round(
            attendance_score * 0.4 +
            task_score * 0.6,
            2
        )

        leaderboard_data.append({
            "user_id": user.id,
            "name": user.name,
            "attendance_score": round(attendance_score, 2),
            "task_score": round(task_score, 2),
            "performance_score": performance_score
        })

    leaderboard_data.sort(
        key=lambda x: x["performance_score"],
        reverse=True
    )

    for index, employee in enumerate(leaderboard_data):
        employee["rank"] = index + 1

    return jsonify(leaderboard_data), 200
@app.route("/projects", methods=["POST"])
@jwt_required()
def create_project():

    current_user_id = int(get_jwt_identity())

    data = request.get_json()

    project = Project(
        name=data.get("name"),
        description=data.get("description"),
        assigned_team=data.get("assigned_team"),
        milestone=data.get("milestone"),
        deliverable_url=data.get("deliverable_url"),
        completion_percentage=data.get(
            "completion_percentage",
            0
        ),
        created_by=current_user_id
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully"
    }), 201
@app.route("/projects", methods=["GET"])
@jwt_required()
def get_projects():

    projects = Project.query.all()

    result = []

    for project in projects:
        result.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "assigned_team": project.assigned_team,
            "milestone": project.milestone,
            "deliverable_url": project.deliverable_url,
            "completion_percentage":
                project.completion_percentage
        })

    return jsonify(result), 200
@app.route("/projects/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):

    project = Project.query.get(project_id)

    if not project:
        return jsonify({
            "message": "Project not found"
        }), 404

    data = request.get_json()

    project.completion_percentage = data.get(
        "completion_percentage",
        project.completion_percentage
    )

    project.milestone = data.get(
        "milestone",
        project.milestone
    )

    db.session.commit()

    return jsonify({
        "message": "Project updated successfully"
    }), 200
# Delete task
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"message": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200

# Update profile
@app.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    data = request.get_json()
    user.name = data.get("name", user.name)
    user.department = data.get("department", user.department)
    user.phone = data.get("phone", user.phone)
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200

# Delete project  
@app.route("/projects/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200
if __name__ == "__main__":
    app.run(debug=True)
