const mongoose = require("mongoose");

const dbConfig = {
    dbName: 'leetmatDB',
    password: 'nqFPYekqgWAVE0pX'
}

let urlConnection = 'mongodb+srv://leetmate:<password>@web-cluster.9md0b.mongodb.net/<dbname>?retryWrites=true&w=majority'
urlConnection = urlConnection.replace('<password>', dbConfig.password).replace('<dbname>', dbConfig.dbName);

mongoose.connect(urlConnection, {useNewUrlParser: true, useUnifiedTopology: true});

// Delaración de esquemas
const productSchema = {
    name: {type: String, required: true},
    description: String,
    price : Number,
    images: {type: [String]}
};


// Creación de esquemas
const Producto = mongoose.model("Producto", productSchema)


// Metodos publicos
export const findProductById = id => {
    Producto.findById(req.query.productId, function(err, foundProduct){
        if (!err) {
            return {
                product: foundProduct, 
                allSizes: allSizes, 
                allColors:allColors
            }
        } 
        return null;
    });
}