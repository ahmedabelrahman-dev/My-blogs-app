import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";


// express app
const app = express();

// connect to mongodb & listen for requests
const dbConnect = 'mongodb+srv://ahmad:test1234@cluster0.1h8ifsy.mongodb.net/my_databaes?retryWrites=true&w=majority';

mongoose.connect(dbConnect, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 })
  .then(result => app.listen(3000))
  .catch(err => console.log(err));

// register view engine
app.set('view engine', 'ejs');

// middleware & static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});

// mongoose model
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  snippet: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: true });

const Blog = mongoose.model('Blog', blogSchema);

// mongoose & mongo tests 
app.get('/', (req, res) => {
  res.redirect('/blogs');
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'About' });
});

// blog routes
app.get('/blogs/create', (req, res) => {
  res.render('create', { title: 'Create a new blog' });
});

app.get('/blogs', (req, res) => {
  Blog.find().sort({ createdAt: -1 })
    .then(result => {
      res.render('index', { blogs: result, title: 'All blogs' });
    })
    .catch(err => {
      console.log(err);
    });
});
app.post('/blogs',(req,res) => {
  const blog = new Blog(req.body);
  blog.save()
  .then((result) => {
    res.redirect('/blogs');
  })
  .catch((err) => {
    console.log(err);
  })
})
app.get('/blogs/:id',(req,res) =>{
  const id = req.params.id;
  Blog.findById(id)
    .then((result) => {
      res.render('detail',{blog:result,title:'blog details'});
    })
    .catch((err) => {
      console.log(err);
    })
})
app.delete('/blogs/:id', (req, res) => {
  const id = req.params.id;
  
  Blog.findByIdAndDelete(id)
    .then(result => {
      res.json({ redirect: '/blogs' });
    })
    .catch(err => {
      console.log(err);
    });
});

// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});