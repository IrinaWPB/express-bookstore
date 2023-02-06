process.env.NODE_ENV = "test"

const db = require("../db");
const Book = require("../models/book");
const request = require("supertest");
const app = require("../app");

let testBook;

beforeEach( async () => {
    await db.query("DELETE FROM books");
    
    const result = await db.query(
        `INSERT INTO books (
              isbn,
              amazon_url,
              author,
              language,
              pages,
              publisher,
              title,
              year) 
           VALUES ('test_isbn', 
                   'test_url',
                   'test_author',
                   'english',
                   200,
                   'test_publisher',
                   'test_title',
                   1990) 
           RETURNING isbn,
                     amazon_url,
                     author,
                     language,
                     pages,
                     publisher,
                     title,
                     year`);
    console.log(result.rows)
    testBook = result.rows[0];
})

describe ("GET /books", () => {
    test("Get all books", async () => {
        const res = await request(app).get('/books')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ books : [testBook]})
    })
})

describe ("GET /books/:isbn", () => {
    test("Get a single book by isbn", async () => {
        const res = await request(app).get('/books/test_isbn')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ book : testBook })
    })
    test("Isbn doesn't exist", async () => {
        const res = await request(app).get('/books/wrong_isbn')
        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({"error": {"message": "There is no book with an isbn 'wrong_isbn", "status": 404}})
    })
})

describe ("POST /books", () => {
    test("Book created with all required fields valid", async () => {
        const res = await request(app).post('/books')
        .send({isbn: "test_isbn2",
               amazon_url: "test_url2",
               author: "test_author2",
               language: "english",
               pages: 245,
               publisher: "test_publisher2",
               title: "test_title2",
               year: 2000 })
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual( { book : {isbn: "test_isbn2",
                                            amazon_url: "test_url2",
                                            author: "test_author2",
                                            language: "english",
                                            pages: 245,
                                            publisher: "test_publisher2",
                                            title: "test_title2",
                                            year: 2000 }} )
    })
    test("One of the fields is missing(publisher f.e)", async () => {
        const res = await request(app).post('/books')
        .send({isbn: "test_isbn2",
               amazon_url: "test_url2",
               author: "test_author2",
               language: "english",
               pages: 245,
               title: "test_title2",
               year: 2000 })
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({"error": {"message": ["instance requires property \"publisher\""], "status": 400}})
    })
    test("One of the fields is the worng datatype(amazon_url is boolean f.e)", async () => {
        const res = await request(app).post('/books')
        .send({isbn: "test_isbn2",
               amazon_url: true,
               author: "test_author2",
               language: "english",
               pages: 245,
               publisher: "test_publisher2",
               title: "test_title2",
               year: 2000 })
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({"error": {"message": ["instance.amazon_url is not of a type(s) string"], "status": 400}})
    })
})

describe ("PUT /books/:isbn", () => {
    test("Book updated with all required fields valid and existing isbn", async () => {
        const res = await request(app).put('/books/test_isbn')
        .send({isbn: "test_isbn",
               amazon_url: "new_test_url",
               author: "test_author",
               language: "english",
               pages: 200,
               publisher: "test_publisher",
               title: "test_title",
               year: 1990 })
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual( { book : {isbn: "test_isbn",
                                            amazon_url: "new_test_url",
                                            author: "test_author",
                                            language: "english",
                                            pages: 200,
                                            publisher: "test_publisher",
                                            title: "test_title",
                                            year: 1990 }} )
    })

    test("Isbn is not found", async () => {
        const res = await request(app).put('/books/wrong_isbn')
        .send({isbn: "test_isbn",
               amazon_url: "new_test_url",
               author: "test_author",
               language: "english",
               pages: 200,
               publisher: "test_publisher",
               title: "test_title",
               year: 1990 })
        expect(res.statusCode).toBe(404)
        expect(res.body).toEqual({"error": {"message": "There is no book with an isbn 'wrong_isbn", "status": 404}})
    })

    test("Valid isbn but invalid data sent", async () => {
        const res = await request(app).put('/books/test_isbn')
        .send({isbn: "test_isbn",
               amazon_url: true,
               author: "test_author",
               language: "english",
               pages: 200,
               title: "test_title",
               year: 1990 })
        expect(res.statusCode).toBe(400)
        expect(res.body).toEqual({"error": {"message": ["instance requires property \"publisher\"", 
                                                        "instance.amazon_url is not of a type(s) string"], 
                                            "status": 400}})
    })
})

describe ("DELETE books/:isbn", () => {
    test('Deletes book from DB', async() => {
        const res = await request(app).delete('/books/test_isbn')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({"message": "Book deleted"})
    })
})


afterAll(async function () {
    await db.end();
  });


  