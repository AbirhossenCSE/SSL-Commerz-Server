const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const SSLCommerzPayment = require('sslcommerz-lts')

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wpavw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// SSL Commerz
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false //true for live, false for sandbox


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const database = client.db('SSL-Commerz');
        const productCollection = database.collection('product');

        // Initialize SSLCommerzPayment
        // const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

        // SSL Commerz
        const tran_id = new ObjectId().toHexString();

        app.post("/order", async (req, res) => {
            // console.log("order data", req.body);
            const product = await productCollection.findOne({ _id: new ObjectId(req.body.productId) });
            // console.log(product);
            const order = req.body;

            const data = {
                total_amount: product?.price * order.purchaseQuantity,
                currency: 'BDT',
                tran_id: tran_id, // use unique tran_id for each api call
                success_url: 'http://localhost:3030/success',
                fail_url: 'http://localhost:3030/fail',
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: order.customerName,
                cus_email: 'customer@example.com',
                cus_add1: order.customerAddress,
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: order.customerPhone,
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            console.log(data);

            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                console.log("API res", apiResponse);
              
                let GatewayPageURL = apiResponse.GatewayPageURL;
                res.send({ url: GatewayPageURL });
                console.log('Redirecting to: ', GatewayPageURL)
            });

        })




        // Get All Product
        app.get("/product", async (req, res) => {
            try {
                const product = await productCollection.find().toArray();
                res.json(product || []);
            } catch (error) {
                res.status(500).json({ message: "Failed to fetch product", error: error.message });
            }
        });


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Task is hare')
})
app.listen(port, () => {
    console.log(`Task at: ${port}`)
})




