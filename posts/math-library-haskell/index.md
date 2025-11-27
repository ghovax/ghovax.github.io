---
title: "Symbolic Mathematics Engine in Haskell"
date: "2025-11-27"
excerpt: "Building a symbolic mathematics library from scratch in Haskell, exploring algebraic manipulation, differentiation, and Taylor series expansion through functional programming."
category: "Computer Science"
tags: ["Haskell", "Symbolic Math", "Functional Programming", "Computer Algebra"]
author: "Giovanni Gravili"
---

In this post, I'll walk you through my implementation of a symbolic mathematics engine in Haskell. This project taught me that Haskell's algebraic data types are perfectly suited for representing mathematical expressions. The ability to pattern match on expression structure makes implementing transformations incredibly natural, with each mathematical rule becoming a pattern match clause. The separation of concerns between operations proved crucial: substitution doesn't simplify, differentiation doesn't evaluate. Each function does one thing well, and we compose them to achieve complex transformations.

The challenge of symbolic mathematics is fundamentally different from numerical computing. Rather than evaluating an expression like:

$$f(x) = x^2 + 3x + 2$$

at a specific point $x = 5$ to get $42$, we manipulate the expression itself: factor it into $(x+1)(x+2)$, differentiate it to get $2x + 3$, or substitute $x$ with another expression.

The key insight is that mathematical expressions form a tree structure. The expression $\frac{x^2 + 1}{x - 3}$ is really a division node whose children are an addition node and a subtraction node. By representing expressions as algebraic data types in Haskell, we can use pattern matching to implement mathematical operations as tree transformations. This is the essence of computer algebra systems like Mathematica and SymPy.

# Expression Representation and Substitution

The foundation is an algebraic data type capturing essential operations:

```haskell
data Expr
  = Sum Expr Expr      -- Addition: a + b
  | Prod Expr Expr     -- Multiplication: a * b
  | Pow Expr Expr      -- Exponentiation: a^b
  | Real Double        -- Numeric constants
  | Var String         -- Variables like "x", "y"
  | List [Expr]        -- Lists of expressions
  | Neg Expr           -- Negation: -a
  | Inv Expr           -- Reciprocal: 1/a
  | Log Expr Expr      -- Logarithm with base: log_b(a)
  | Ln Expr            -- Natural logarithm: ln(a)
  deriving (Show, Eq)
```

I use binary operators exclusively. Addition and multiplication always have exactly two children, making pattern matching predictable. I represent subtraction and division as derived operations:

```haskell
-- Subtraction: a - b = a + (-b)
sub :: Expr -> Expr -> Expr
sub a b = Sum a (Neg b)

-- Division: a / b = a * (1/b)
divide :: Expr -> Expr -> Expr
divide a b = Prod a (Inv b)
```

This reduces cases to handle. Instead of separate rules for `Sum` and `Sub`, we only handle `Sum`. The expression $x - 2$ becomes `Sum (Var "x") (Neg (Real 2))` internally.

Substitution is a straightforward recursive tree traversal:

```haskell
substitute :: Expr -> Expr -> Expr -> Expr
substitute expr target replacement = case expr of
  Sum a b -> Sum (substitute a target replacement)
                 (substitute b target replacement)
  Prod a b -> Prod (substitute a target replacement)
                   (substitute b target replacement)
  Pow a b -> Pow (substitute a target replacement)
                 (substitute b target replacement)
  Neg a -> Neg (substitute a target replacement)
  Inv a -> Inv (substitute a target replacement)
  Var v -> case target of
    Var x | x == v -> replacement
    _ -> Var v
  List items -> List (map (\x -> substitute x target replacement) items)
  Log base arg -> Log (substitute base target replacement)
                      (substitute arg target replacement)
  Ln arg -> Ln (substitute arg target replacement)
  _ -> expr
```

For compound expressions, recursively substitute in subexpressions. For variables, check if they match the target. For constants, do nothing. Substitution is name-based: if we're substituting $x \rightarrow 5$, we only replace variables named "$x$".

# Simplification and Derivatives

Simplification applies algebraic identities to reduce expressions: $x + 0 = x$, $x \cdot 1 = x$, $x^0 = 1$, and evaluates constants:

```haskell
simplify :: Expr -> Expr
simplify expr = case expr of
  -- Addition identities
  Sum (Real 0) a -> simplify a
  Sum a (Real 0) -> simplify a
  Sum a b | a == b -> Prod (Real 2) (simplify a)  -- a + a = 2a
  Sum (Real a) (Real b) -> Real (a + b)
  Sum a b -> Sum (simplify a) (simplify b)

  -- Multiplication identities
  Prod (Real 0) _ -> Real 0
  Prod _ (Real 0) -> Real 0
  Prod (Real 1) a -> simplify a
  Prod a (Real 1) -> simplify a
  Prod (Real a) (Real b) -> Real (a * b)
  Prod a b | a == b -> Pow (simplify a) (Real 2)  -- a * a = a²
  Prod a b -> Prod (simplify a) (simplify b)

  -- Exponentiation, negation, logarithms...
  Pow (Real x) (Real 0) | x > 0 -> Real 1
  Pow x (Real 1) -> simplify x
  Pow (Real 1) _ -> Real 1
  Pow _ (Real 0) -> Real 1
  Pow (Real a) (Real b) -> Real (a ** b)
  Pow base exponent -> Pow (simplify base) (simplify exponent)
  
  Neg (Real x) -> Real (-x)
  Neg (Neg a) -> simplify a  -- -(-a) = a
  Neg (Sum a b) -> Sum (simplify (Neg a)) (simplify (Neg b))
  Neg (Prod a b) -> Prod (simplify (Neg a)) (simplify b)
  Neg (Pow a b) -> Pow (simplify (Neg a)) (simplify b)
  Neg (Inv a) -> Inv (simplify (Neg a))
  Neg a -> Neg (simplify a)
  
  Log (Real 1) _ -> Real 0
  Log _ (Real 1) -> Real 0
  Ln (Real 1) -> Real 0
  List items -> List (map simplify items)
  _ -> expr
```

One pass isn't always enough. We need iterative simplification to a fixed point:

```haskell
simplifyFully :: Expr -> Expr
simplifyFully = simplifyWithLimit 100
  where
    simplifyWithLimit :: Int -> Expr -> Expr
    simplifyWithLimit 0 expr = expr
    simplifyWithLimit n expr =
      let simplified = simplify expr
      in if simplified == expr
         then expr
         else simplifyWithLimit (n - 1) simplified
```

Computing derivatives symbolically implements standard calculus rules via pattern matching:

```haskell
derivative :: String -> Expr -> Expr
derivative var expr = case expr of
  Var v | v == var -> Real 1      -- dx/dx = 1
        | otherwise -> Real 0     -- dy/dx = 0
  Real _ -> Real 0                -- dc/dx = 0
  
  -- Sum rule: d/dx(f + g) = f' + g'
  Sum f g -> Sum (derivative var f) (derivative var g)
  
  -- Product rule: d/dx(f * g) = f' * g + f * g'
  Prod f g -> Sum (Prod (derivative var f) g)
                  (Prod f (derivative var g))
  
  -- Power rule: d/dx(f^n) = n * f^(n-1) * f'
  Pow f n -> Prod n (Prod (Pow f (sub n (Real 1)))
                          (derivative var f))
  
  Neg f -> Neg (derivative var f)
  
  -- Reciprocal rule: d/dx(1/f) = -f' / f²
  Inv f -> Neg (divide (derivative var f) (Pow f (Real 2)))
  
  Log _ arg -> Prod (divide (Real 1) (Prod arg (Ln arg)))
                    (derivative var arg)
  Ln arg -> divide (derivative var arg) arg
  List items -> List (map (derivative var) items)
```

The chain rule emerges naturally from the recursive structure. Higher derivatives are trivial:

```haskell
nthDerivative :: Int -> String -> Expr -> Expr
nthDerivative 0 _ expr = expr
nthDerivative n var expr = nthDerivative (n - 1) var (derivative var expr)
```

# Taylor Series

The Taylor series approximates any sufficiently smooth function as a polynomial. For a function $f(x)$ expanded around $x = a$:

$$f(x) \approx \sum_{n=0}^{N} \frac{f^{(n)}(a)}{n!}(x-a)^n$$

```haskell
taylorSeries :: Expr -> String -> Double -> Int -> Expr
taylorSeries expr var center degree = foldl1 Sum (map term [0..degree])
  where
    factorial :: Int -> Integer
    factorial n = product [1 .. toInteger n]

    term :: Int -> Expr
    term n =
      let coefficient = Real (1 / fromIntegral (factorial n))
          offset = Sum (Var var) (Real (-center))
          power = Pow offset (Real (fromIntegral n))
          derivSimplified = simplifyFully (nthDerivative n var expr)
          derivAtCenter = substitute derivSimplified (Var var) (Real center)
          derivValue = simplifyFully derivAtCenter
      in simplifyFully (Prod (Prod coefficient derivValue) power)
```

For each term in the series, we need to compute the coefficient $\frac{1}{n!}$, construct the power term $(x-a)^n$, compute the $n$th derivative, evaluate it at the center point $a$, and combine everything together. The implementation handles all of this systematically, computing:

$$\text{term}_n = \frac{f^{(n)}(a)}{n!}(x-a)^n$$

# Testing and Validation

I built a comprehensive test suite to verify the correctness of the implementation. The tests cover three main areas: simplification rules, logarithm identities, and Taylor series expansion.

**Simplification tests** verify that algebraic identities are applied correctly:

$$42 = 42 \quad\text{(identity)}$$

$$5 + 0 = 5 \quad\text{(addition identity)}$$

$$(1 \cdot 3) \cdot x^2 = 3x^2 \quad\text{(constant folding)}$$

$$1 + (-(-(-(-1)))) = 2 \quad\text{(double negation)}$$

$$(x + (1 + 3))^{2 \cdot (0 + 1)} = (x + 4)^2 \quad\text{(nested simplification)}$$

**Logarithm tests** ensure special cases are handled properly:

$$\log_1(x) = 0, \quad \log_x(1) = 0, \quad \ln(1) = 0$$

**Taylor series tests** verify polynomial approximations by computing derivatives and evaluating them at the expansion point. For $f(x) = x^2 - 4x + 1$ expanded around $x = 1$ to degree $n=2$, we compute:

$$f(1) = -2, \quad f'(x) = 2x - 4 \Rightarrow f'(1) = -2, \quad f''(x) = 2 \Rightarrow f''(1) = 2$$

The Taylor series is then:

$$f(x) \approx -2 + (-2)(x-1) + \frac{2}{2!}(x-1)^2 = -2 - 2(x-1) + (x-1)^2$$

For $f(x) = x^3 - 3x^2 + 4$ expanded around $x = 2$ to degree $n=3$:

$$f(2) = 0, \quad f'(2) = 0, \quad f''(x) = 6x - 6 \Rightarrow f''(2) = 6, \quad f'''(x) = 6 \Rightarrow f'''(2) = 6$$

The Taylor series becomes:

$$f(x) \approx 0 + 0 \cdot (x-2) + \frac{6}{2!}(x-2)^2 + \frac{6}{3!}(x-2)^3 = 3(x-2)^2 + (x-2)^3$$

All 11 tests pass, giving confidence that the core algorithms are correct.

# Conclusion

Building this symbolic mathematics engine demonstrates how functional programming naturally expresses mathematical concepts. The elegance is striking: functions like `derivative` are remarkably concise, just dozens of lines, yet handle arbitrarily complex expressions through recursion and pattern matching. 

The mathematical structure guided the implementation at every step. The rules of calculus naturally map to pattern matching clauses. The tree structure of expressions naturally leads to recursive algorithms. The need for iterative improvement naturally suggests fixed-point iteration. The code practically wrote itself once I understood the mathematical foundations.

The engine is simple compared to Mathematica or SymPy, but it captures the essential ideas. It computes real derivatives, performs real simplifications, and generates real Taylor series. Understanding how it works, down to every pattern match and recursive call, gives me deep appreciation for the elegant mathematics underlying computer algebra systems.
