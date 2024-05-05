const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const _ = require("lodash");
const cors = require('cors')
app.use(cors());
// Set the view engine to EJS
app.set("view engine", "ejs");

// Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files directory
app.use(express.static(path.join(__dirname, "public")));

// Database connection
const mongoDBUri = "mongodb+srv://Guest:cRlLctwloDOOa6Vf@cluster0.m4veolx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Content variables
const homeContent = "ToDo lists";

// Mongoose schema for blogs
const NoteSchema = new mongoose.Schema({
    parentID: String,
    content: String, // Changed from 'Content' to 'content'
    completed: Boolean 
});


const Notes = mongoose.model("PF_TWNotes", NoteSchema);

app.get("/", async (req, res) => {
    try {
        const notes = await Notes.find({
            parentID: null
        });
        res.render("home", { content: homeContent, notes });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching notes');
    }
});

app.get("/compose", (req, res) => {
    res.render("compose");
});

app.post("/compose", async (req, res) => {
    const newNote = new Notes({
        parentID: null,
        content: req.body.title,
        completed: false
    });
    try {
        await newNote.save();
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving note');
    }
});

app.get("/composeEntry/:id", (req, res) => {
    res.render("composeEntry",{
        id : req.params.id
    });
});

app.post("/composeEntry/:id", async (req, res) => {
    const newNote = new Notes({
        parentID: req.params.id,
        content: req.body.title,
        completed: false
    });
    try {
        await newNote.save();
        res.redirect("/notes/" + req.params.id);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving note');
    }
});

app.post("/completed", async (req, res) => {
    try {
        const result = await Notes.findByIdAndUpdate(req.query.id,
        {
            completed: req.query.completedBool
        });
        
       if (!result) {
            return res.status(404).send('Note not found');
        }
        res.redirect("/notes/"+req.query.noteId);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error (un)completing note');
    }
});

// Ricordarsi di mettere route non dinamiche PRIMA di una dinamica ;) 
app.get('/search', async (req, res) => {
    if (!req.query.query) {
        return res.status(400).send('Query parameter is required');
    }

    try {
        const query = req.query.query; // This explicitly fetches the 'query' parameter from the request URL
        const searchResults = await Notes.find({
            content: { $regex: new RegExp(query, 'i') },
            parentID: null
        }).limit(5);
        res.json(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error performing search');
    }
});

// Generic routes should come after all specific routes
app.get("/notes/:listId", async (req, res) => {
    try {
        const list = await Notes.findById(req.params.listId);
        const notes = await Notes.find({
            parentID: list._id
        });
        if (list) {
            res.render("notes", {
                id : list._id,
                note: list.content,
                notes:notes
            });
        } else {
            res.status(404).send('Note not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching note');
    }
});

app.post('/notes/delete/:id', async (req, res) => {
    try {
        const result = await Notes.findByIdAndDelete(req.params.id);
        
       if (!result) {
            return res.status(404).send('Note not found');
        }
        else {
            const children = await Notes.deleteMany({parentID: req.params.id})
        }

        if(req.query.noteId){
        res.redirect('/notes/'+req.query.noteId);} // Redirect to the homepage or another appropriate page
        else{
            res.redirect('/');}
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting note');
    }
});

app.get("/about", (req, res) => {
    res.render("about");
});



// Update any redirect or link that refers to this route
// For example, in your views or redirection after creating a post




// Listen on default port 3000
app.listen(3000);
