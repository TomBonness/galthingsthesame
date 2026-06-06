# Experiment No. 03 // The Galton Decision-Tree

> An inquiry into subjective choice and mathematical certainty.

---

## The Core Concept: Free Will vs. The Bell Curve

Can your deepest, most personal, subjective choices be predicted by a formula?

When you choose **Coffee** over **Tea**, **Cities** over **Forests**, or **Logic** over **Instinct**, you experience it as a conscious act of free will. It is deliberate, reflective, and non-random. 

But if we aggregate the choices of hundreds of people, something remarkable happens. Individual subjectivity dissolves into mathematical certainty. The Galton Decision-Tree is a digital, human-in-the-loop Galton pegboard that maps subjective choices into physical trajectories, proving that collective free will obeys the **Central Limit Theorem**.

```
              ● [Start]
             / \
     (0) Coffee  Tea (1)
           /     \
   (0) Morning   Night (1)
         /   \   /   \
               ●
              / \
             [Bin]
```

Every participant answers 10 standard subjective dichotomies. Choosing the left option routes the token left (`0`); choosing the right option routes it right (`1`). As the token bounces down the pegboard, it collides with pegs (representing your choices) and eventually lands in one of 11 bins at the bottom. 

Even though you are not a random bounce, **you and the group are the physics** that generates the Gaussian bell curve.

---

## The Mathematics: The Lindeberg-Feller CLT

In a classical Galton board, a token has a uniform $50\%$ chance of bouncing left or right at every peg. This generates a standard binomial distribution.

However, human preferences are not uniform. The probability $p_i$ of choosing **Forests** over **Cities** is different from the probability $p_j$ of choosing **Analog** over **Digital**. Every level of our pegboard has a unique, non-identical probability distribution.

How does a bell curve still emerge? 

This is where the **Lindeberg-Feller Central Limit Theorem** comes in. Under Lindeberg-Feller, as long as no single choice dominates the variance of the system (i.e., the Lindeberg condition holds), the sum of independent, non-identically distributed Bernoulli trials $S_n = \sum_{i=1}^{10} X_i$ still converges to a normal Gaussian distribution:

$$\frac{S_n - \mu}{\sigma} \xrightarrow{d} \mathcal{N}(0, 1)$$

Where:
* **Expected Mean**: $\mu = \sum_{i=1}^{10} p_i$
* **Expected Variance**: $\sigma^2 = \sum_{i=1}^{10} p_i(1 - p_i)$

Our backend dynamically computes these group probabilities $p_i$ using **Laplace smoothing** to smooth out early sample noise:

$$p_i = \frac{\text{count}(1) + 1}{\text{total runs} + 2}$$

As you run the experiment, you see the red **Lindeberg-Feller Limit Curve** morph in real-time, reflecting the evolving group dynamics.

---

## Minimalist Vector Visuals

This project features a clean, high-contrast interface designed for maximum responsiveness:
* **Binary Choice Focus**: Massive, bold typography guides the eye to the key subjective questions.
* **Vector Board & Pathing**: Live SVG lines follow your choices in real-time, mapping your decisions dynamically down the board.
* **Responsive Layouts**: On mobile, elements stack to prevent overlaps, ensuring a smooth experience on any device.
---

## Architecture: Serverless Group State

This project runs on a completely serverless AWS architecture:

1. **Static Frontend**: A Next.js App Router static export (`output: 'export'`) deployed via an **AWS Amplify Hosting** CI/CD pipeline.
2. **REST API**: An **AWS API Gateway** HTTP API that forwards requests to Lambda.
3. **Compute**: An **AWS Lambda** Node function (`index.mjs`) that processes new runs and aggregates table statistics.
4. **Database**: An **AWS DynamoDB** table (`GaltonBoardRuns`) acting as the global ledger of all historical choices.

---

## Development

If you want to play with the code locally:

### Prerequisites
Make sure you have Node.js (v18+) installed.

### 1. Run the Frontend
Install local dependencies and spin up the Next.js development server:
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 2. Deploy the Backend
If you want to deploy or update your own serverless AWS infrastructure:
1. Make sure you have your AWS CLI credentials configured (`aws configure`).
2. Run the deployment script:
   ```bash
   node scripts/deploy-backend.js
   ```
   This will automatically zip the Lambda function, provision DynamoDB and IAM configurations, create the API Gateway HTTP API, and log your new live API endpoint.
