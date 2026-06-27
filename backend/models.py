from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="Employee")
    department = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "department": self.department
        }
class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False
    )

    check_in = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    check_out = db.Column(
        db.DateTime,
        nullable=True
    )

    total_hours = db.Column(
        db.Float,
        default=0
    )

    date = db.Column(
        db.Date,
        default=datetime.utcnow().date
    )

    status = db.Column(
        db.String(20),
        default="Present"
    )    
class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200), nullable=False)

    description = db.Column(db.Text)

    assigned_to = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False
    )

    assigned_by = db.Column(
        db.Integer,
        db.ForeignKey('users.id'),
        nullable=False
    )

    priority = db.Column(
        db.String(20),
        default="Medium"
    )

    status = db.Column(
        db.String(30),
        default="Pending"
    )

    deadline = db.Column(db.DateTime)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )    
   
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    assigned_team = db.Column(db.String(200))
    milestone = db.Column(db.String(200))
    deliverable_url = db.Column(db.String(500))
    completion_percentage = db.Column(db.Integer, default=0)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))    