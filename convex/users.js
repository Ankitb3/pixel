import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before.
    // Note: If you don't want to define an index right away, you can use
    // ctx.db.query("users")
    //  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
    //  .unique();
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }
    // If it's a new identity, create a new `User`.
   return await ctx.db.insert("users", {
  name: identity.name ?? "Anonymous",
  email: identity.email,
  imageUrl: identity.pictureUrl,
  plan: "free",
  projectUsed: 0,
  createdAt: Date.now(),
  exportsThisMonth: 0,
  externalId: identity.subject, // Or use identity.tokenIdentifier again if that's your ID
  tokenIdentifier: identity.tokenIdentifier,
  lastActiveAt: Date.now(),
});
  },
});


export const getCurrentUsers= query({
    handler:async(ctx)=>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error("Not authenticated")
        }

         const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique(); 

      if(!user){
        throw new Error("User Not Found")
      }
      return user
    }
})