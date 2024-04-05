const { NotFoundError, BadRequestError } = require("../core/error.response");
const cartModel = require("../models/cart.model");
const orderModel = require("../models/order.model");
const DiscountService = require("./discount.service");
const ProductService = require("./product.service");
const RedisService = require("./redis.service");

class CheckoutService {
  static async checkoutReview({ cartId, userId, shopOrderIds = [] }) {
    /* 
    shopOrderIds = [
        {
            shopId,
            discounts:[{
                        shopId,
                        code,
                        discountId,
                    }]
            products:[
                {
                    productId,
                    quantity,
                    price,
                    
                }
            ]
        }
    ] */
    const storedCartId = await cartModel.findOne({
      _id: cartId,
      userId: userId,
    });
    const shopOrderIdsEnd = [];
    const checkOrder = {
      originPrice: 0,
      discountedPrice: 0,
      feeShip: 0,
      totalDiscount: 0,
    };
    if (!storedCartId) {
      throw new NotFoundError("Not found");
    }
    for (const order of shopOrderIds) {
      const { shopId, discounts, products } = order;
      const checkoutedProducts = await ProductService.checkout(
        products,
        shopId
      );
      if (!checkoutedProducts) {
        throw new BadRequestError("Product is invalid");
      }
      const originPrice = checkoutedProducts.reduce((pre, cur) => {
        return pre + cur.price * cur.quantity;
      }, 0);
      const itemCheckout = {
        shopId,
        discounts,
        products: checkoutedProducts,
        totalDiscount: 0,
        originPrice,
        discountedPrice: originPrice,
      };

      if (discounts?.length) {
        const fistDis = discounts[0];
        const disRe = await DiscountService.getDiscountAmount({
          shopId: shopId,
          products: checkoutedProducts,
          code: fistDis.code,
        });
        const { discount, newTotalOrderPrice } = disRe;
        if (discount > 0) {
          itemCheckout.totalDiscount += discount;
          checkOrder.totalDiscount += discount;
        }
      }
      checkOrder.originPrice += itemCheckout.originPrice;
      itemCheckout.discountedPrice = originPrice - itemCheckout.totalDiscount;

      shopOrderIdsEnd.push(itemCheckout);
    }
    checkOrder.discountedPrice =
      checkOrder.originPrice - checkOrder.totalDiscount;
    const checkout = {
      userId,
      cartId,
      shopOrderIds,
      shopOrderIdsEnd,
      checkOrder,
    };
    await RedisService.storeCheckout(checkout);
    return checkout;
  }
}
module.exports = CheckoutService;