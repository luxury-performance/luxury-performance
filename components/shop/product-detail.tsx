'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Minus, Plus } from 'lucide-react';
import type { Product, InstallationService } from '@/lib/shop/types';
import { money } from '@/lib/shop/types';
import { supplierOf, categoryOf, tagsFor, fitLabel } from '@/lib/shop/taxonomy';
import { partnerForSupplier } from '@/lib/partners';
import { ProductThumbnails } from './product-thumbnails';
import { ProductVideos } from './product-videos';
import { ProductOffer } from './product-offer';
import { isUsedPart, wheelGroupSize } from '@/lib/shop/used-parts';
import offerStyles from './product-offer.module.css';
import { useShopCart } from './cart-provider';
export function ProductDetail({product,initialVariant,installations,videos,preview=false}:{product:Product;initialVariant?:string;installations:Record<string,InstallationService>;videos:string[];preview?:boolean}){
 const initial=product.variants.nodes.find(v=>v.id.split('/').pop()===initialVariant)||product.variants.nodes.find(v=>v.availableForSale)||product.variants.nodes[0];
 const images = [...new Map([...product.images.nodes, ...product.variants.nodes.flatMap(v => v.image ? [v.image] : [])].map(image => [image.url, image])).values()];
 const [withInstallation,setWithInstallation]=useState(false);
 const [variantId,setVariantId]=useState(initial.id),[photo,setPhoto]=useState(initial.image?.url||product.images.nodes[0]?.url),[quantity,setQuantity]=useState(1);
 const variant=product.variants.nodes.find(v=>v.id===variantId)!, cart=useShopCart();
 const used=isUsedPart(product), groupSize=wheelGroupSize(product), setOnly=!!groupSize;
 function select(id:string){setVariantId(id);setQuantity(1);const v=product.variants.nodes.find(v=>v.id===id)!;setPhoto(v.image?.url || product.featuredImage?.url || images[0]?.url);setWithInstallation(false);const url=new URL(location.href);url.searchParams.set('variant',id.split('/').pop()!);history.replaceState(null,'',url);}
 const installation=installations[variantId];
 const fits=tagsFor(product,'fit');
 return <div className="shop-page shop-product-page"><div className="shop-topline"><Link href={preview?"/collections/used-parts":"/shop"}>{preview?"Used parts preview":"The collection"}</Link><span>/</span><Link href={preview?"/collections/used-parts":partnerForSupplier(supplierOf(product)) ? `/partners/${supplierOf(product)}` : `/shop?brand=${supplierOf(product)}`}>{product.vendor}</Link><span>/</span><span>{categoryOf(product)}</span></div><div className="shop-product-layout"><section className="shop-gallery" aria-label="Product images"><div className="shop-main-image">{photo?<img src={photo} alt={images.find(i=>i.url===photo)?.altText||product.title}/>:<span>{product.vendor}</span>}</div>{images.length>1&&<ProductThumbnails images={images} selected={photo} onSelect={setPhoto}/>}</section><section className="shop-product-information"><span className="tiny-label">{product.vendor} / {categoryOf(product)}</span><h1>{product.title.replace(/^TECHART\s*[-–]\s*/i,'')}</h1><div className="shop-product-price">{preview&&Number(variant.price.amount)===0?'Price pending':money(variant.price)}</div><div className="shop-stock-row"><span className={`shop-stock ${variant.currentlyNotInStock?'special':!variant.availableForSale?'unavailable':''}`}>{!variant.availableForSale?'Out of stock':variant.currentlyNotInStock?'Special Order':'In stock'}</span>{used&&<span className="shop-condition">Used · limited to available stock</span>}</div>
  {setOnly && <p className={offerStyles.setUnit}>{groupSize === 4 ? 'Complete set' : groupSize === 3 ? 'Three-wheel lot' : 'Wheel pair'} · {groupSize} wheels · Sold together</p>}
  {product.variants.nodes.length>1&&<label className="shop-field shop-variant"><span>Configuration</span><select value={variantId} onChange={e=>select(e.target.value)}>{product.variants.nodes.map(v=><option value={v.id} key={v.id}>{v.title}{!v.availableForSale?' — Out of stock':''}</option>)}</select></label>}
  {installation && <label className="shop-installation-option"><input type="checkbox" checked={withInstallation} disabled={cart.busy || !variant.availableForSale} onChange={e=>setWithInstallation(e.target.checked)}/><span><strong>Add installation in Dubai <span>+ {money({...installation.price,amount:String(Number(installation.price.amount)*quantity)})}</span></strong><small>{installation.title}{quantity>1?` · ${quantity} units`:''}</small><small>We’ll contact you to arrange the appointment.</small></span></label>}
  {product.variants.pageInfo.hasNextPage?<p>Please <a href={`https://lxpforged.com/products/${product.handle}`}>view all configurations in our existing store</a>.</p>:<div className="shop-purchase-row">{!setOnly && <div className="shop-quantity"><button disabled={quantity<=1||cart.busy} aria-label="Decrease quantity" onClick={()=>setQuantity(q=>q-1)}><Minus size={16}/></button><input aria-label="Quantity" type="number" min={1} max={99} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(99,Number(e.target.value)||1)))}/><button disabled={quantity>=99||cart.busy} aria-label="Increase quantity" onClick={()=>setQuantity(q=>q+1)}><Plus size={16}/></button></div>}<button className="shop-button" disabled={preview||!variant.availableForSale||cart.busy} onClick={()=>!preview&&cart.add({handle:product.handle,variantId:variant.id,quantity,title:product.title,variantTitle:variant.title,installation:withInstallation && !!installation})}>{preview?'Preview only':cart.busy?'Adding…':variant.availableForSale?'Add to bag':'Out of stock'}<ArrowRight size={18}/></button></div>}
  {used && <ProductOffer key={variant.id + ':' + quantity} product={product} variant={variant} quantity={setOnly ? 1 : quantity} setSize={groupSize} />}
  <p className="shop-delivery-note">{preview?'Review only. Purchasing is disabled in this preview.':variant.currentlyNotInStock?'Supplier order. Additional delivery time applies; we’ll confirm the estimate after your order.':'Availability is checked again when you add to your bag.'}</p>
  <div className="shop-product-assurance"><span>Selected by Luxury Performance</span><span>Installation support in Dubai</span><span>Secure Shopify checkout</span></div>
  {!!videos.length&&<a className="shop-video-jump" href="#product-videos">Hear it in action <ArrowRight size={16}/></a>}
  <details open className="shop-detail"><summary>The details <Plus size={16}/></summary><div className="shop-description shop-description-rich" dangerouslySetInnerHTML={{__html:product.descriptionHtml}}/>{variant.sku&&<p className="shop-sku">Part number: {variant.sku}</p>}</details>
  {!!fits.length&&<details className="shop-detail"><summary>Vehicle fitment <Plus size={16}/></summary><div className="shop-fit-tags">{fits.map(f=><span key={f}>{fitLabel(f)}</span>)}</div><p>Check your exact model and year before ordering.</p></details>}
  <div className="shop-product-help"><p>Every specification starts with a conversation.</p><Link href="/contact">Ask our team about this part <ArrowUpRight size={16}/></Link></div>
 </section></div><ProductVideos ids={videos} title={product.title}/></div>;
}
