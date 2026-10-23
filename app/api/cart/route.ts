import { cookies } from 'next/headers';
import { storefront, getProduct } from '@/lib/shop/storefront';
import { CART_QUERY, CART_CREATE, CART_ADD, CART_UPDATE } from '@/lib/shop/queries';
import { getVariantStock } from '@/lib/shop/inventory';
import { allocateOrder, isSpecial } from '@/lib/shop/order-policy';
import { installationFor, installationGroup, installationHandles, parentQuantity, linkedInstallationUpdates } from '@/lib/shop/installation';
import { getInstallation, cartWithInstallations } from '@/lib/shop/installation-server';
import type { Cart } from '@/lib/shop/types';
const cookieName='lxp_shop_cart';
const locks = new Map<string, Promise<void>>();
async function exclusive<T>(key:string,work:()=>Promise<T>) { const previous=locks.get(key)||Promise.resolve(); let release!:()=>void;const next=new Promise<void>(r=>{release=r;});locks.set(key,next);await previous;try{return await work();}finally{release();if(locks.get(key)===next)locks.delete(key);} }
async function visible(cart:Cart|null){if(!cart)return null;const decorated=await cartWithInstallations(cart).catch(()=>cart);const {id: _id,...safe}=decorated!;void _id;return safe;}
async function readCart(){const id=(await cookies()).get(cookieName)?.value;if(!id)return null;return (await storefront<{cart:Cart|null}>(CART_QUERY,{id},true)).cart;}
export async function GET(){try{return Response.json({cart:await visible(await readCart())},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({message:'Your cart could not load. Please try again.'},{status:503});}}
type MutationResult={cart:Cart|null;userErrors:{message:string}[];warnings:{message:string}[]};
async function mutate(query:string,variables:Record<string,unknown>){const data=await storefront<Record<string,MutationResult>>(query,variables,true);const result=Object.values(data)[0];if(result.userErrors.length)throw new Error(result.userErrors.map(e=>e.message).join(' '));if(!result.cart)throw new Error('Could not update your cart. Please try again.');return result;}
export async function POST(request:Request){
  const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({message:'Please reload the page and try again.'},{status:403});
  let body:Record<string,unknown>;try{body=await request.json();}catch{return Response.json({message:'Invalid request.'},{status:400});}
  const cookieStore=await cookies();const key=cookieStore.get(cookieName)?.value||crypto.randomUUID();
  return exclusive(key,async()=>{
    try {
      let cart=await readCart();
      if(cart?.lines.pageInfo.hasNextPage)return Response.json({message:'Please complete your current order before adding more items.'},{status:400});
      if(body.action==='checkout'){
        if(cart?.lines.nodes.some(l=>installationFor(l) && l.quantity!==parentQuantity(cart!.lines.nodes,installationFor(l)!))) return Response.json({message:'Please remove and re-add installation so it matches your exhaust quantity.'},{status:409});
        return Response.json({cart:await visible(cart)});
      }
      if(body.action==='installation'){
        const parent=cart?.lines.nodes.find(l=>l.id===body.lineId);
        if(!parent || installationFor(parent) || typeof body.enabled!=='boolean')return Response.json({message:'Choose an exhaust in your bag first.'},{status:400});
        const group=installationGroup(parent), existing=cart!.lines.nodes.filter(l=>installationFor(l)===group);
        if(!body.enabled){
          if(!existing.length)return Response.json({cart:await visible(cart)});
          const result=await mutate(CART_UPDATE,{cartId:cart!.id,lines:existing.map(l=>({id:l.id,quantity:0}))});
          return Response.json({cart:await visible(result.cart),warnings:result.warnings});
        }
        if(existing.length)return Response.json({cart:await visible(cart)});
        const product=await getProduct(parent.merchandise.product.handle,true), variant=product?.variants.nodes.find(v=>v.id===parent.merchandise.id);
        const service=product&&variant?await getInstallation(product,variant,true):null;
        if(!service)return Response.json({message:'Installation is not currently available for this configuration.'},{status:409});
        const result=await mutate(CART_ADD,{cartId:cart!.id,lines:[{merchandiseId:service.variantId,quantity:parentQuantity(cart!.lines.nodes,group),attributes:[{key:'_installation_for',value:group},{key:'Installation for',value:`${product!.title} — ${variant!.title}`.slice(0,255)}]}]});
        return Response.json({cart:await visible(result.cart),warnings:result.warnings});
      }
      if(body.action==='update'){
        const line=cart?.lines.nodes.find(l=>l.id===body.lineId), quantity=Number(body.quantity);
        if(!line||!Number.isInteger(quantity)||quantity<0||quantity>line.quantity)return Response.json({message:'Invalid quantity change.'},{status:400});
        const result=await mutate(CART_UPDATE,{cartId:cart!.id,lines:[{id:line.id,quantity},...linkedInstallationUpdates(cart!.lines.nodes,line,quantity)]});
        return Response.json({cart:await visible(result.cart),warnings:result.warnings});
      }
      if(body.action!=='add'||typeof body.handle!=='string'||typeof body.variantId!=='string'||!Number.isInteger(body.quantity)||Number(body.quantity)<1||Number(body.quantity)>99)return Response.json({message:'Choose a valid product and quantity.'},{status:400});
      const product=await getProduct(body.handle,true), variant=product?.variants.nodes.find(v=>v.id===body.variantId);
      if(!product||!variant||!variant.availableForSale)return Response.json({message:'This option is no longer available.'},{status:409});
      if(installationHandles.includes(product.handle))return Response.json({message:'Add installation through its matching exhaust.'},{status:400});
      const stock=await getVariantStock(product,variant);
      if(!stock)throw new Error('Stock could not be checked. Please try again.');
      const lines=cart?.lines.nodes||[];
      const matching=lines.filter(l=>l.merchandise.id===variant.id);
      const inCart=matching.filter(l=>!isSpecial(l.attributes)).reduce((sum,l)=>sum+l.quantity,0);
      const stockOnly=stock.policy==='deny'||product.tags.includes('condition_used');
      const plan=allocateOrder(stock.tracked?Math.max(0,stock.quantity):0,Number(body.quantity),inCart);
      if(stockOnly&&stock.tracked&&matching.reduce((n,l)=>n+l.quantity,0)+Number(body.quantity)>stock.quantity)return Response.json({message:`Only ${Math.max(0,stock.quantity)} ${stock.quantity===1?'unit is':'units are'} available. This item cannot be ordered beyond its stock.`},{status:409});
      const needsNotice=!stockOnly&&variant.requiresShipping&&plan.special>0;
      if(needsNotice&&(!Number.isInteger(body.confirmSpecial)||Number(body.confirmSpecial)<plan.special))return Response.json({confirmation:plan},{status:409});
      const requestedParent=typeof body.parentLineId==='string'?lines.find(l=>l.id===body.parentLineId && l.merchandise.id===variant.id && !installationFor(l)):undefined;
      if(body.parentLineId && !requestedParent)return Response.json({message:'This item changed. Please reopen your bag.'},{status:409});
      const existingParent=requestedParent || matching.find(l=>!installationFor(l) && lines.some(s=>installationFor(s)===installationGroup(l))===(body.installation===true));
      const group=existingParent?installationGroup(existingParent):crypto.randomUUID();
      const existingService=lines.find(l=>installationFor(l)===group);
      const needsInstallation=body.installation===true || !!existingService;
      const service=needsInstallation?await getInstallation(product,variant,true):null;
      if(needsInstallation&&!service)return Response.json({message:'Installation is no longer available for this configuration. Please remove installation and try again.'},{status:409});
      const attributes=[{key:'_lxp_installation_group',value:group}];
      const additions:{merchandiseId:string;quantity:number;attributes:{key:string;value:string}[]}[]=[];
      if(!needsNotice)additions.push({merchandiseId:variant.id,quantity:Number(body.quantity),attributes});
      else {
        if(plan.stocked)additions.push({merchandiseId:variant.id,quantity:plan.stocked,attributes});
        additions.push({merchandiseId:variant.id,quantity:plan.special,attributes:[...attributes,{key:'Order type',value:'Special order — supplier lead time applies'},{key:'_lxp_fulfillment',value:'special_order'}]});
      }
      if(service)additions.push({merchandiseId:service.variantId,quantity:Number(body.quantity),attributes:existingService?.attributes || [{key:'_installation_for',value:group},{key:'Installation for',value:`${product.title} — ${variant.title}`.slice(0,255)}]});
      const result=cart?await mutate(CART_ADD,{cartId:cart.id,lines:additions}):await mutate(CART_CREATE,{input:{lines:additions,buyerIdentity:{countryCode:'AE'}}});
      cart=result.cart!;
      cookieStore.set(cookieName,cart.id!,{httpOnly:true,secure:new URL(request.url).protocol==='https:',sameSite:'lax',path:'/',maxAge:60*60*24*14});
      return Response.json({cart:await visible(cart),warnings:result.warnings});
    }catch(error){return Response.json({message:error instanceof Error?error.message:'Could not update your cart. Please try again.'},{status:503});}
  });
}
