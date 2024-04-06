import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

// requireAuth middleware will validate the access token sent by the client and will return the user information within req.auth
app.get("/notes", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  const notes = await prisma.note.findMany({
    where: {
      authorId: user.id,
    },
  });

  res.json(notes);
});

// creates a note
app.post("/notes", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400).send("title and content are required");
  } else {
    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        author: { connect: { auth0Id } },
      },
    });

    res.status(201).json(newNote);
  }
});

// deletes a note by id
app.delete("/notes/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const deletedNote = await prisma.note.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(deletedNote);
});

// get a note by id
app.get("/notes/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const note = await prisma.note.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  res.json(note);
});

// updates a note by id
app.put("/notes/:id", requireAuth, async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;
  const updatedNote = await prisma.note.update({
    where: {
      id: parseInt(id),
    },
    data: {
      title,
      content,
    },
  });
  res.json(updatedNote);
});

// get Profile information of authenticated user
app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        username: name,
        password: "",
      },
    });

    res.json(newUser);
  }
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});
