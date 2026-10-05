export interface Product {
    $id: string;
    name: string;
    price: number;
    imageUrl: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Favorite {
    $id: string;
    userId: string;
    productId: string;
}