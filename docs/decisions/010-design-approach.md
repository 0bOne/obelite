# ADR for design approach

## Requirement

There are many ways to design an application that manipulates data.  Most popular is model based (MVC, MVVM) that has evolved from early Java busoness objects and N-tier design.  

Similarly there are many ways to structure backend-services: MVC, SOA, Microservices.

Clients also tend to follow a pattern inherited from this choice.

## Options Considered

The options mentioned in the requirement section have all been used to build various systems, along with the chosen option.

The chosen option is by far the most efficient, least code, lest effort and lowest risk of bugs

## Option Chosen

A Metadata-driven will be used to construct all endpoints, and logic whereever applicable.  Highly reusable units of logic will be executed in the order and configuration specified in metadata. This dovetails nicely with dependency injection and lowers the amount of test automation by an order of magnitude.

## Ramifications

Metadata driven design is not widely used, and therefore counter intuitive to those used to n-tier/mvvm approaches. However, because it is a very low code approach, there is considerably less ramp-up time for new developers.









