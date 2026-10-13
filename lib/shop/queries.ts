export const PRODUCT_CARD = `id title handle vendor productType tags availableForSale featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } }`;
export const VARIANT = `id title sku availableForSale currentlyNotInStock requiresShipping price { amount currencyCode } image { url altText } selectedOptions { name value }`;
export const CATALOG_QUERY = `query Catalog($after: String) { products(first: 100, after: $after) { nodes { ${PRODUCT_CARD} } pageInfo { hasNextPage endCursor } } }`;
export const PRODUCT_QUERY = `query Product($handle: String!) { product(handle: $handle) { ${PRODUCT_CARD} description descriptionHtml seo { title description } images(first: 250) { nodes { url altText } } variants(first: 100) { nodes { ${VARIANT} } pageInfo { hasNextPage } } } }`;
export const COLLECTION_QUERY = `query Collection($handle: String!, $after: String) { collection(handle: $handle) { title description seo { title description } products(first: 100, after: $after) { nodes { ${PRODUCT_CARD} } pageInfo { hasNextPage endCursor } } } }`;
export const COLLECTIONS_QUERY = `query Collections($after: String) { collections(first: 100, after: $after) { nodes { handle title } pageInfo { hasNextPage endCursor } } }`;
export const CART_FIELDS = `id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } } lines(first: 100) { nodes { id quantity attributes { key value } cost { totalAmount { amount currencyCode } } merchandise { ... on ProductVariant { ${VARIANT} product { title handle featuredImage { url altText } } } } } pageInfo { hasNextPage } }`;
export const CART_QUERY = `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`;
export const CART_CREATE = `mutation CreateCart($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } warnings { message } } }`;
export const CART_ADD = `mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } warnings { message } } }`;
export const CART_UPDATE = `mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } warnings { message } } }`;

export const PRODUCT_VIDEOS_QUERY = `query ProductVideos($handle: String!) { product(handle: $handle) { videos: metafield(namespace: "custom", key: "valvetronic_youtube_videos") { value } } }`;
