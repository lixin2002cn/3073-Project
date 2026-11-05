# DSAA3073 Individual Final Project

## When does a weighted vote make fewer mistakes?

Individual project · Focus on theoretical analysis

### Project overview

Each base model predicts a label. An ensemble combines these predictions in a vote. You will use exponential loss on a training sample to choose the voting weights. When can this vote make fewer mistakes on new examples than the best base model?

## 1. Problem setup

### Sample, base models and weighted voting

Let \(H=\{h_1,\ldots,h_M\}\) be a fixed set of binary classifiers, with \(M\ge2\). Each classifier predicts either \(-1\) or \(+1\). The sample \(S=((X_i,Y_i))_{i=1}^n\sim P^n\) consists of independent observations drawn from an unknown distribution \(P\). Choose and train the base models independently of \(S\).

The weights in \(w\) are nonnegative and add up to one. The set of allowed weights is

\[
w\in\Delta_M=\left\{w\in\mathbb R^M:w_j\ge0,\ \sum_{j=1}^M w_j=1\right\}.
\]

Add the weighted predictions to get a score. Its sign gives the predicted label.

\[
f_w(x)=\sum_{j=1}^M w_j h_j(x),\qquad g_w(x)=\operatorname{sign}(f_w(x)).
\]

A tied vote predicts the positive class, so \(\operatorname{sign}(0)=+1\). Let \(e_j\) be the vector that assigns all the weight to model \(j\), so \(g_{e_j}=h_j\). Multiply the score by the true label to get the margin, \(yf_w(x)\).

### Classification error rate and exponential risk

The **population error rate** is the chance that a classifier \(g\) makes a mistake on a new example. The **empirical error rate** is the fraction of mistakes on the sample.

\[
L(g)=\Pr_{(X,Y)\sim P}\{g(X)\ne Y\},\qquad
\widehat L_S(g)=\frac1n\sum_{i=1}^n\mathbf1\{g(X_i)\ne Y_i\}.
\]

For a score \(f_w\), the **population exponential risk** is the mean exponential loss under the data distribution. The **empirical exponential risk** is the mean exponential loss on the sample.

\[
R_{\exp}(w)=\mathbb E_P[e^{-1-Yf_w(X)}],\qquad
\widehat R_{\exp,S}(w)=\frac1n\sum_{i=1}^n e^{-1-Y_if_w(X_i)}.
\]

Let \(\widehat w\) be any set of weights with the lowest empirical exponential risk.

\[
\widehat w\in\arg\min_{w\in\Delta_M}\widehat R_{\exp,S}(w).
\]

### How much can a vote improve on the best base model?

Let \(L_H^*=\min_{1\le j\le M}L(h_j)\) be the population error rate of the best base model. The maximum gain is the largest drop in error that a weighted vote can achieve compared with this model.

\[
G(P)=L_H^*-\inf_{w\in\Delta_M}L(g_w).
\]

Each base model corresponds to an allowed weight vector, so \(G(P)\ge0\). If \(G(P)>0\), some ensemble has a strictly lower population error rate than the best base model. If \(G(P)=0\), the best base model already achieves the lowest population error rate in the ensemble class.

## 2. Three research questions

### Question 1 · How can we bound the error rate of a vote?

Fix \(k\) inputs and record the predictions of the \(M\) base models. As you change the weights, how many different lists of labels can the vote produce? Use the capacity of the voting class \(\mathcal G=\{g_w:w\in\Delta_M\}\) to bound the gap between sample error and population error. For any \(0<\delta<1\), show that the bound holds for all weights at once, with probability at least \(1-\delta\) over the draw of the sample.

\[
\sup_{w\in\Delta_M}\bigl|L(g_w)-\widehat L_S(g_w)\bigr|
\le B_{01}(M,n,\delta).
\]

Give a formula for \(B_{01}\), or give its order of growth and state when it holds. Explain how the bound depends on \(M\), \(n\) and \(\delta\). A valid upper bound on capacity is sufficient for this question. Finding the exact capacity is a possible extension.

Use your result to write an upper bound \(U_{01}(w)\) on the population classification error rate. Explain why it also applies to \(\widehat w\) chosen using the same sample. You will compare this bound with the one you get in Question 2.

### Question 2 · What does exponential risk tell us about classification error?

Analyze the class of ensemble scores \(\mathcal F=\{f_w:w\in\Delta_M\}\). Show that the following two-sided bound on exponential risk holds with probability at least \(1-\delta\).

\[
\sup_{w\in\Delta_M}\bigl|R_{\exp}(w)-\widehat R_{\exp,S}(w)\bigr|
\le B_{\exp}(M,n,\delta).
\]

1. **A single base model.** Set \(w=e_j\). Calculate the exponential loss for a correct prediction and for an incorrect prediction. Derive the exact relationship between \(R_{\exp}(e_j)\) and \(L(h_j)\). Explain how to convert upper and lower bounds for either measure into bounds for the other.
2. **A general ensemble.** Explain how the sign and size of \(Yf_w(X)\) affect classification loss and exponential loss. Use your exponential risk bound and the relationship between the two losses to derive an upper bound on the population error rate of the same classifier, \(L(g_w)\le U_{\exp}(w)\).

Choose an example or a family of models where you can calculate both \(U_{01}(w)\) and \(U_{\exp}(w)\). Use the same sample and weights, with one confidence level for both bounds together. Work out how much uncertainty comes from the finite sample and how much you lose by using exponential risk to bound classification error. Which effect matters more in your example? Use your comparison to explain what you can say about the vote with learned weights \(\widehat w\).

### Question 3 · What determines how much a vote can reduce error?

Choose a set of base models and a data distribution, or build a family of models with a parameter you can vary. Pick one condition that you think affects the maximum gain \(G(P)\). What can you prove under your assumptions? Give a worked example and explain which results from Questions 1 and 2 apply.

If you find a positive gain, give weights \(w_0\) and prove that this vote has a lower population error rate than the best base model. Give a lower bound \(C(S,H,\delta)\) that you can calculate from the sample and your assumptions. Prove that the following holds with probability at least \(1-\delta\).

\[
G(P)\ge L_H^*-L(g_{w_0})\ge C(S,H,\delta).
\]

Explain when your lower bound is positive and how much improvement it then guarantees. If you use the learned weights \(\widehat w\) as \(w_0\), the bound applies to the vote learned from the sample.

If you claim that \(G(P)=0\), prove that every allowed choice of weights satisfies

\[
L(g_w)\ge L_H^*\qquad\text{for all }w\in\Delta_M.
\]

If the lower bound for one vote is zero or negative, the maximum gain could still be positive.

Once you have a result, change or relax one condition you used. Which steps of your proof still work? Explain what you can show under the new condition and what remains open.

## 3. What to include in your report

Use the IEEE two-column conference format. Keep the main text to **6 pages or fewer**, including figures and tables. References and appendices do not count toward the limit. [IEEE Conference template on Overleaf](https://www.overleaf.com/latex/templates/ieee-conference-template/grfzhhncsfqn)

Work on your own. For each of the three questions, give your first result. Then ask a question about it and try to answer it. In your report, explain why you made each attempt and what you found. If another approach gives the same bound or a weaker one, explain why. In your presentation, show how a finding in one question shaped your work on the next.

1. Describe your models, data distribution and assumptions. Say which quantities you know and which you estimate from the sample.
2. Give your bounds and proofs for Questions 1 and 2. Compare the two error bounds for the same vote and explain why they differ.
3. Give a worked example for Question 3. Explain which condition your proof depends on and what you found when you changed it.
4. For each probability guarantee, say what is sampled at random and how the bound depends on the parameters. If you use several bounds together, explain why they all hold with probability at least \(1-\delta\).
5. List the course notes and other sources you used. When you cite a theorem, explain why its assumptions hold in your setting.

**Optional simulation.** Choose a parameter and the values to test. Write down what you expect, then compare the gain in your simulation with your theoretical lower bound. State what your results support and for which settings.

Lectures 3–5 cover capacity and generalization. Lectures 8–9 cover voting classifiers, exponential loss and margins.
