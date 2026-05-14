# Add product‑level `price_override` support

## Goal
Allow a product without variants to specify a custom price that overrides the default `min_price`/discount calculation. This price will be used by the frontend when `getCheapestVariant` falls back to the product’s base price.

## Affected Backend Files
- `internal/model/product_model.go` – add `PriceOverride *float64` to `Product` and related response structs.
- `internal/controller/product/product_controller.go` – modify price resolution to prioritize `PriceOverride` when present for both admin and user responses.
- Any place where `FinalPrice` is set (admin create/update, user detail, admin detail) to use the new logic.
- Update JSON tags for the new field (`json:"price_override"`).

## Database Migration (out of scope for code change)
> Add a nullable `price_override` column to the `products` table.

## Frontend Impact
No changes needed; the frontend reads `product.final_price` (or `product.min_price`). Once the backend returns the correct `final_price`, the UI will display the overridden price.

## Implementation Steps
1. **Model Update** – add `PriceOverride *float64` to `Product` and to user/admin response structs.
2. **Helper Function** – create `resolvePrice(product *model.Product) float64` that returns:
   ```go
   if product.PriceOverride != nil && *product.PriceOverride > 0 {
       return *product.PriceOverride
   }
   return calcFinalPrice(product.MinPrice, product.DiscountPercent)
   ```
3. **Controller Adjustments** – replace direct `calcFinalPrice` calls with `resolvePrice` in:
   - `UserGetProductDetailController`
   - `AdminGetProductDetailController`
   - `CreateProductController` (response)
   - `UpdateProductController` (response)
   - Any list endpoints exposing `FinalPrice`.
4. **Tests** – add unit tests for `resolvePrice` covering override, no override, and zero/negative values.
5. **Verification** – build the Go server, run API calls, and confirm `final_price` matches the override. Verify UI shows correct price.

## Verification Plan
- Run `go build ./...` – ensure compilation.
- Start the API and fetch a product with `price_override` set; verify `final_price` equals the override.
- Check a product without variants but with `price_override` displays correctly on the frontend.
- Run existing test suite.

## Open Questions
- Should `price_override` be exposed in the public API (`UserProductResponse`)?
- Do we need to adjust CSV import/export to handle the new field?
