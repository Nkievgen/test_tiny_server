This is a tiny node.js API app.

It is currently hosted by me on a server 82.165.56.189 on 3000 port, so you can try it by accessing four endpoints (DB has an admin user with username 'admin' and password 111111, you can use it to assign subservients and to get a full list of users'):
http://82.165.56.189:3000/register
http://82.165.56.189:3000/login
http://82.165.56.189:3000/list
http://82.165.56.189:3000/assign

If you want to host it yourself then please note that in database.js the app tries to connect to 'root'@'localhost' mysql server and takse KEY env variable as a password to 'root'. Then it looks for 'users' schema in the DB.

It uses mysql database with one table to store user info. User model looks like this: 
{
    id: int //primary key with autoincrement
    username: string //unique username
    password_hash: string //password are not stored as plain text, instead password hashes are created with bcrypt library
    admin: boolean //determines wether user has admin rights or not
    boss_id: int //stores id of the user to which this user is subordinate. Also this field is not found in model.js as the assosiation is declared in app.js
}

Users have only two roles: admin users and non-admin users, determined by admin field. Boss role exists as an asbstraction, meaning that app checks if user has any other users assigned to them through boss_id field in the DB or not.

It has four endpoints:

/register
This endpoint only expects two query parameters: username and password. It will add the user to the database and return a message that registration is successful.
Example registering as 'user1' with password 123456:
http://localhost:3000/register?username=user1&password=123456
Answer:
{
    "message": "User user1 registered successfully."
}

/login
Login expects a username and a password just as register endpoint, but it will try to find a user with that username in the database, compare provided password with store hash and if check is passed it will return a messsage and an authorization token expected by next two endpoints.
Example logging in as 'admin' user with password 111111:
http://localhost:3000/login?username=admin&password=111111
Answer:
{
    "message": "Authorization successful.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY3NzY2ODg4NSwiZXhwIjoxNjc3NzU1Mjg1fQ.savWJNXPy6upVhHhgemOBjN7t9mfbli8Ry5jtnT3y-g"
}

/list
List endpoint only expects the 'token' query parameter. Token used by the app to identify the user and send him an appropriate list of users (which is a list of himself, his subordinates and their sub-subordinates and so on recursivly);
Example getting a list of users as previousely logged in 'admin' user:
http://localhost:3000/list?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY3NzY2ODg4NSwiZXhwIjoxNjc3NzU1Mjg1fQ.savWJNXPy6upVhHhgemOBjN7t9mfbli8Ry5jtnT3y-g
Answer:
{
    message: "List of users fetched successfully.",
    data: [
        {
            username: "admin",
            boss: null
        },
        {
            username: "user1",
            boss: null
        }
    ]
}

/assign
Aside from token parameter like in previous endpoint, assign endpoint expects assignee and boss parameters. The app will search for a user with 'assignee' username, then search for a user with a 'boss' username, and then assign assignee user to be subservient to boss user. It will either return a success message, or an error message in case either assignee or boss users are not subservients of user who makes a request (but users with admin rights can assign everyone with no restrictions).
Example of assigning user1 to be a subservient of user2:
http://localhost:3000/assign?assignee=user1&boss=user2&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY3NzY2ODg4NSwiZXhwIjoxNjc3NzU1Mjg1fQ.savWJNXPy6upVhHhgemOBjN7t9mfbli8Ry5jtnT3y-g
Answer:
{
    "message": "Assignment succesfull: user1 is now a subordinate of user2."
}