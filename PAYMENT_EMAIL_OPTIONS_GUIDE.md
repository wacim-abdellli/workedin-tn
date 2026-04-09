# Payment & Email Options Guide - Khedma TN
**Date**: 2026-04-09  
**Purpose**: Comprehensive analysis of payment gateway and email service options for Tunisian marketplace

---

## 🎯 EXECUTIVE SUMMARY

### Current Situation
- **Payment**: Code ready for Flouci, waiting on credentials
- **Email**: Code ready for Resend, waiting on domain setup

### Recommended Path
1. **Payment**: Try Flouci for 48 hours → If blocked, switch to Dhmad.tn
2. **Email**: Use Resend free tier (100 emails/month) → Upgrade when needed

---

## 💳 PAYMENT GATEWAY OPTIONS

### Option 1: Flouci (Current Implementation) ⭐ RECOMMENDED

**Status**: ✅ Code already integrated, waiting on credentials

**Pros**:
- ✅ Already integrated in your codebase
- ✅ Authorized by Central Bank of Tunisia
- ✅ 250,000+ active accounts in Tunisia
- ✅ Direct payment processing (not just escrow)
- ✅ Supports cards, bank accounts, Flouci wallets
- ✅ Modern API with good documentation
- ✅ QR code payments supported
- ✅ Sandbox environment for testing

**Cons**:
- ❌ Currently blocked on getting production credentials
- ❌ May have setup/approval delays
- ⚠️ Fees not publicly disclosed (need to contact them)

**Integration Status**:
- ✅ Edge Functions: `flouci-initiate-payment`, `flouci-verify-payment`
- ✅ Client code: `src/lib/flouci.ts`
- ✅ Wallet deposit: `src/pages/Wallet.tsx`
- ✅ Contract payments: Ready

**Next Steps**:
1. Contact Flouci at [email protected] or app.flouci.com
2. Request production API credentials
3. Set 48-72 hour deadline
4. If not available, switch to Dhmad

**Estimated Timeline**: 2-7 days (if responsive)

---

### Option 2: Dhmad.tn (Escrow-Specific) ⭐ STRONG ALTERNATIVE

**Status**: 🔄 Not integrated, but has API and perfect for freelance marketplace

**What is Dhmad?**
- Tunisian escrow platform specifically designed for marketplaces
- Acts as trusted third party between buyers and sellers
- Holds funds until both parties satisfied
- **Already used by "Tunisie Freelance"** (your direct competitor!)

**Pros**:
- ✅ **Perfect fit for freelance marketplace** (escrow-first design)
- ✅ Tunisian company, understands local market
- ✅ RESTful API with good documentation
- ✅ Sandbox environment (sandbox.dhmad.tn)
- ✅ Built specifically for marketplace use cases
- ✅ Handles disputes natively
- ✅ Proven in production (Tunisie Freelance uses it)
- ✅ Rate limit: 100 req/min (reasonable)

**Cons**:
- ❌ Requires code changes (2-3 days work)
- ❌ Need to apply for developer account
- ⚠️ Pricing not publicly disclosed
- ⚠️ Smaller company (less established than Flouci)

**API Overview**:
```
Base URL (production): https://dhmad.tn/api/v1
Base URL (sandbox): https://sandbox.dhmad.tn/api/v1
Authentication: Bearer token or X-API-Key header
Content-Type: application/json
```

**Integration Effort**:
- Create escrow on contract acceptance
- Release funds when work approved
- Handle disputes through Dhmad API
- Estimated: 2-3 days development + testing

**Next Steps**:
1. Visit developer.dhmad.tn
2. Apply for developer account
3. Get sandbox API keys
4. Test integration in sandbox
5. Apply for production access

**Estimated Timeline**: 5-10 days (including development)

---

### Option 3: Hybrid Approach (Flouci + Dhmad) 🔄 FUTURE OPTION

**Concept**: Use Flouci for deposits, Dhmad for escrow

**Pros**:
- ✅ Best of both worlds
- ✅ Flouci for simple wallet top-ups
- ✅ Dhmad for contract escrow (their specialty)
- ✅ Redundancy if one provider has issues

**Cons**:
- ❌ Most complex to implement
- ❌ Two provider relationships to manage
- ❌ Higher integration maintenance
- ❌ More expensive (two sets of fees)

**Recommendation**: Consider for Phase 2, not launch

---

### Option 4: Manual/External Only 🚫 NOT RECOMMENDED

**Concept**: Launch without automated payments, handle manually

**Pros**:
- ✅ Can launch immediately
- ✅ No provider dependencies

**Cons**:
- ❌ Terrible user experience
- ❌ High operational overhead
- ❌ Trust issues (no escrow protection)
- ❌ Not scalable
- ❌ Competitive disadvantage

**Recommendation**: Avoid unless absolutely necessary

---

## 📊 PAYMENT GATEWAY COMPARISON

| Feature | Flouci | Dhmad.tn | Hybrid | Manual |
|---------|--------|----------|--------|--------|
| **Integration Status** | ✅ Done | ❌ Need 2-3 days | ❌ Need 5-7 days | ✅ N/A |
| **Escrow Native** | ⚠️ Build yourself | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **Tunisian Market** | ✅ 250K users | ✅ Marketplace-focused | ✅ Both | ✅ Local |
| **API Quality** | ✅ Modern | ✅ RESTful | ✅ Both | ❌ N/A |
| **Sandbox** | ✅ Yes | ✅ Yes | ✅ Both | ❌ N/A |
| **Setup Time** | 2-7 days | 5-10 days | 10-14 days | 0 days |
| **Proven for Freelance** | ⚠️ General | ✅ Yes (Tunisie Freelance) | ✅ Yes | ❌ No |
| **Dispute Handling** | ⚠️ Build yourself | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **Scalability** | ✅ High | ✅ High | ✅ High | ❌ Low |
| **User Trust** | ✅ High (250K users) | ✅ High (escrow) | ✅ Highest | ❌ Low |

---

## 📧 EMAIL SERVICE OPTIONS

### Option 1: Resend (Current Implementation) ⭐ RECOMMENDED

**Status**: ✅ Code already integrated, waiting on domain setup

**Pricing**:
- **Free Tier**: 100 emails/month, 1 domain
- **Pro**: $20/month, 50,000 emails/month, 10 domains
- **Scale**: Custom pricing, unlimited emails

**Pros**:
- ✅ Already integrated in your codebase
- ✅ **FREE for first 100 emails/month** (perfect for launch)
- ✅ Modern, developer-friendly API
- ✅ Excellent deliverability
- ✅ 30-day email logs
- ✅ Webhook support for all events
- ✅ No credit card required for free tier

**Cons**:
- ⚠️ Requires domain verification (DNS records)
- ⚠️ 100 emails/month may be tight for growth
- ⚠️ Need to upgrade to Pro ($20/month) quickly

**Integration Status**:
- ✅ Edge Function ready
- ✅ Email templates ready
- ❌ Domain verification pending

**Next Steps**:
1. Sign up at resend.com (free)
2. Add your domain (khedma.tn)
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain (24-48 hours)
5. Get API key
6. Set in Supabase secrets

**Estimated Timeline**: 2-3 days (DNS propagation)

**Monthly Cost Projection**:
- Month 1-2: $0 (free tier, <100 emails)
- Month 3+: $20/month (Pro tier, up to 50K emails)

---

### Option 2: Brevo (formerly Sendinblue) 💰 FREE ALTERNATIVE

**Pricing**:
- **Free Tier**: 300 emails/day (9,000/month!)
- **Starter**: €25/month, 20,000 emails/month
- **Business**: €65/month, 100,000 emails/month

**Pros**:
- ✅ **Much more generous free tier** (9,000 vs 100 emails)
- ✅ Good for early growth
- ✅ SMS capabilities included
- ✅ Marketing automation features
- ✅ European company (GDPR compliant)

**Cons**:
- ❌ Requires code changes (1-2 days)
- ❌ Brevo branding on free tier emails
- ⚠️ API less modern than Resend
- ⚠️ More complex than needed

**Recommendation**: Consider if Resend's 100 emails/month is too limiting

---

### Option 3: Mailgun 💰 PAY-AS-YOU-GO

**Pricing**:
- **Foundation**: $35/month, 5,000 emails included
- **Growth**: $80/month, 100,000 emails included
- **Pay-as-you-go**: $0.80 per 1,000 emails

**Pros**:
- ✅ Flexible pay-as-you-go pricing
- ✅ Excellent deliverability
- ✅ Detailed logs and analytics
- ✅ Email validation API included

**Cons**:
- ❌ No free tier
- ❌ Requires code changes (1-2 days)
- ❌ More expensive than Resend for low volume

**Recommendation**: Consider for high-volume future (10K+ emails/month)

---

### Option 4: Amazon SES 💰 CHEAPEST (But Complex)

**Pricing**:
- **$0.10 per 1,000 emails** (incredibly cheap!)
- First 62,000 emails free if using EC2

**Pros**:
- ✅ Extremely cheap at scale
- ✅ Highly reliable (AWS infrastructure)
- ✅ No monthly minimums

**Cons**:
- ❌ Complex setup (AWS account, IAM, SES verification)
- ❌ Requires code changes (2-3 days)
- ❌ Starts in "sandbox mode" (need to request production)
- ❌ Less developer-friendly than Resend
- ❌ Need to manage bounce/complaint handling

**Recommendation**: Consider for Phase 2 when sending 50K+ emails/month

---

### Option 5: No Email (Launch Without) 🚫 RISKY

**Concept**: Launch without email notifications

**Pros**:
- ✅ Can launch immediately
- ✅ No provider dependencies
- ✅ Zero cost

**Cons**:
- ❌ Poor user experience (no password resets!)
- ❌ No transactional notifications
- ❌ Users may miss important updates
- ❌ Looks unprofessional
- ❌ Security risk (no password reset)

**Recommendation**: Only if absolutely necessary, and add email within 1-2 weeks

---

## 📊 EMAIL SERVICE COMPARISON

| Feature | Resend | Brevo | Mailgun | Amazon SES | No Email |
|---------|--------|-------|---------|------------|----------|
| **Integration Status** | ✅ Done | ❌ 1-2 days | ❌ 1-2 days | ❌ 2-3 days | ✅ N/A |
| **Free Tier** | 100/month | 9,000/month | ❌ None | ⚠️ Complex | ✅ Free |
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐ Medium | ⭐⭐⭐ Hard | ⭐ None |
| **Cost (1K emails)** | $0 (free) | $0 (free) | $35/month | $0.10 | $0 |
| **Cost (10K emails)** | $20/month | $0 (free) | $35/month | $1 | $0 |
| **Cost (50K emails)** | $20/month | €25/month | $80/month | $5 | $0 |
| **Developer Experience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ❌ |
| **Deliverability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| **Domain Setup** | Required | Required | Required | Required | N/A |
| **Branding** | None | ⚠️ Free tier | None | None | N/A |

---

## 🎯 RECOMMENDED DECISION TREE

### For Payment Gateway:

```
START
  ↓
Can you get Flouci credentials in 48-72 hours?
  ↓
YES → Use Flouci (already integrated)
  ↓
  ✅ LAUNCH with Flouci
  
NO → Is escrow critical for launch?
  ↓
  YES → Integrate Dhmad.tn (2-3 days)
    ↓
    ✅ LAUNCH with Dhmad
    
  NO → Can you wait 1-2 weeks?
    ↓
    YES → Keep trying Flouci
      ↓
      ✅ LAUNCH with Flouci (delayed)
      
    NO → Launch without automated payments
      ↓
      ⚠️ LAUNCH (manual mode)
      Add Dhmad within 2 weeks
```

### For Email Service:

```
START
  ↓
Can you verify domain in 2-3 days?
  ↓
YES → Use Resend free tier (100 emails/month)
  ↓
  Will you exceed 100 emails/month in first month?
    ↓
    NO → ✅ LAUNCH with Resend (free)
    
    YES → Will you exceed 9,000 emails/month?
      ↓
      NO → Consider Brevo (free 9K/month)
        ↓
        ✅ LAUNCH with Brevo (free)
        
      YES → Use Resend Pro ($20/month)
        ↓
        ✅ LAUNCH with Resend (paid)

NO → Can you launch without email for 1 week?
  ↓
  YES → ⚠️ LAUNCH without email
    Add Resend within 1 week
    
  NO → DELAY LAUNCH
    Fix domain verification first
```

---

## 💡 RECOMMENDED LAUNCH STRATEGY

### Phase 1: Immediate (This Week)

**Payment**:
1. **Day 1**: Contact Flouci for credentials
2. **Day 2-3**: If no response, start Dhmad integration
3. **Day 4**: Decision point - Flouci or Dhmad?
4. **Day 5**: Finalize and test chosen provider

**Email**:
1. **Day 1**: Sign up for Resend (free)
2. **Day 1**: Add domain and DNS records
3. **Day 2-3**: Wait for DNS propagation
4. **Day 4**: Verify domain and get API key
5. **Day 5**: Test email sending

**Timeline**: 5-7 days to launch-ready

---

### Phase 2: First Month

**Payment**:
- Monitor transaction volume
- Collect user feedback
- Evaluate if second provider needed

**Email**:
- Monitor email volume
- Upgrade to Pro if exceeding 100/month
- Consider Brevo if cost is concern

---

### Phase 3: Growth (Month 2-6)

**Payment**:
- Consider hybrid approach if volume justifies
- Negotiate better rates with provider
- Add alternative payment methods

**Email**:
- Evaluate Amazon SES if sending 50K+/month
- Implement email analytics
- Optimize deliverability

---

## 📋 IMMEDIATE ACTION CHECKLIST

### For You (Business/Ops):

**Payment - Option A (Flouci)**:
- [ ] Contact Flouci at [email protected]
- [ ] Request production API credentials
- [ ] Ask about fees and approval timeline
- [ ] Set internal deadline: 72 hours max

**Payment - Option B (Dhmad)**:
- [ ] Visit developer.dhmad.tn
- [ ] Apply for developer account
- [ ] Request pricing information
- [ ] Ask about approval timeline

**Email (Resend)**:
- [ ] Sign up at resend.com (free, no credit card)
- [ ] Add domain: khedma.tn
- [ ] Get DNS records (SPF, DKIM, DMARC)
- [ ] Add DNS records to your domain registrar
- [ ] Wait 24-48 hours for verification
- [ ] Get API key once verified

### For Development Team:

**If Flouci approved**:
- [ ] Set secrets in Supabase
- [ ] Redeploy Edge Functions
- [ ] Test payment flow end-to-end
- [ ] ✅ Ready to launch

**If Dhmad chosen**:
- [ ] Create Dhmad integration branch
- [ ] Implement escrow creation on contract
- [ ] Implement fund release on completion
- [ ] Implement dispute handling
- [ ] Test in sandbox
- [ ] Deploy to production
- [ ] ✅ Ready to launch (5-7 days)

**Email (once domain verified)**:
- [ ] Set RESEND_API_KEY in Supabase
- [ ] Test email sending
- [ ] Verify deliverability
- [ ] ✅ Ready to launch

---

## 💰 COST PROJECTION (First 6 Months)

### Conservative Scenario (100 users, 50 contracts/month):

| Month | Payment Fees* | Email Cost | Total |
|-------|--------------|------------|-------|
| 1 | ~$50 | $0 (free) | $50 |
| 2 | ~$100 | $0 (free) | $100 |
| 3 | ~$150 | $20 (Pro) | $170 |
| 4 | ~$200 | $20 | $220 |
| 5 | ~$250 | $20 | $270 |
| 6 | ~$300 | $20 | $320 |

*Assuming 2-3% payment processing fees

### Growth Scenario (500 users, 200 contracts/month):

| Month | Payment Fees* | Email Cost | Total |
|-------|--------------|------------|-------|
| 1 | ~$100 | $0 (free) | $100 |
| 2 | ~$200 | $20 (Pro) | $220 |
| 3 | ~$400 | $20 | $420 |
| 4 | ~$600 | $20 | $620 |
| 5 | ~$800 | $20 | $820 |
| 6 | ~$1,000 | $20 | $1,020 |

---

## 🎯 FINAL RECOMMENDATION

### Payment: **Flouci First, Dhmad Backup**

1. Try Flouci for 48-72 hours (already integrated)
2. If blocked, switch to Dhmad.tn (perfect for marketplace)
3. Consider hybrid approach in 3-6 months

**Why**: Flouci is already integrated (zero dev time), but Dhmad is actually better suited for your freelance marketplace use case.

### Email: **Resend Free Tier**

1. Use Resend free tier (100 emails/month)
2. Upgrade to Pro ($20/month) when needed
3. Consider Brevo if cost is a concern

**Why**: Already integrated, free to start, easy to scale, excellent developer experience.

---

## 📞 CONTACT INFORMATION

### Flouci
- Website: app.flouci.com
- Docs: docs.flouci.com
- Support: (check their website)

### Dhmad
- Website: dhmad.tn
- Developer Portal: developer.dhmad.tn
- Docs: docs.dhmad.tn
- Email: [email protected]
- Status: status.dhmad.tn

### Resend
- Website: resend.com
- Docs: resend.com/docs
- Pricing: resend.com/pricing
- Sign up: Free, no credit card required

---

**Last Updated**: 2026-04-09  
**Next Review**: After provider decisions made  
**Decision Deadline**: 72 hours from now
