import { Request, Response } from "express";
import { CartItems, IUser } from "../models/user.model";
import Product from "../models/product.model";

interface NewRequest extends Request {
  user?: any;
  cartItems?: CartItems[];
}

// export const addToCart = async (req: NewRequest, res: Response) => {
//   try {
//     const { productId } = req.params;
//     const { quantity } = req.body;
//     const user: any = req.user;

//     if (!user?.cartItems) return;
//     const existingItem = user.cartItems.find(
//       (cartitem:any) => cartitem.id === productId
//     );
//     if (existingItem) {
//       if (quantity === 0) {
//         user.cartItems = user.cartItems.filter(
//           (item: any) => item.product.toString() !== productId
//         );
//         await user.save();
//       }
//       existingItem.quantity = quantity;
//       await user.save();
//       res.json(user.cartItems);
//     } else res.status(404).json({ message: "Product not found" });
//   } catch (e: any) {
//     console.log("Error in updateQuantity controller", e.message);
//     res.status(500).json({ message: "Server error", error: e.message });
//   }
// };


export const getCartProducts = async(req: NewRequest, res: Response) => {
  try{
    const products = await Product.find({_id:{$in:req?.user?.cartItems}})
    // add quantity for each product 
    const cartitems = products.map((product)=>{
      const item = req.user?.cartItems.find((cartItem:any)=> cartItem.id===product.id)
      return {...product.toJSON(), quantity:item?.quantity}
    })
    res.json(cartitems);

  }catch(e:any) {
    console.log("Error in getCartProducts controller", e.message);
    res.status(500).json({message:"Server error", error:e.message});
  }
};





export const addToCart = async (req:NewRequest, res: Response) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find((item:any) => item.id === productId);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error:any) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req: NewRequest, res: Response) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item:any) => item.id !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error:any) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req: NewRequest, res: Response) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item:any) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item:any) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error:any) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};