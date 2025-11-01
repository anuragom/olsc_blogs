db = db.getSiblingDB('olsc_db');

db.createUser({
  user: "root",
  pwd: "rootpassword123",
  roles: [ { role: "root", db: "admin" } ]
});

db.createUser({
  user: "appuser",
  pwd: "localpassword123",
  roles: [ { role: "readWrite", db: "olsc_db" } ]
});

db.createUser({
  user: "readonlyuser",
  pwd: "readonly123",
  roles: [ { role: "read", db: "olsc_db" } ]
});
