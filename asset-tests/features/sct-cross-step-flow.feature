@e2e @sct-cross-step @golden-thread
Feature: A Success-Critical Task remains canonical through VSM7
  As a VSM workshop facilitator
  I want one SCT to be progressively enriched across the workshop
  So that later steps never create disconnected copies

  Background:
    Given a fresh browser-local VSM7 workspace
    And Step I defines "Mobility Platform" as the System-in-Focus
    And the recursion structure contains "Northstar Group" at R+1, "Mobility Platform" at R0, and "Product Squads" at R-1
    And Step II carries the selected lever "Strengthen control functions" into the SCT input signals

  Scenario: Carry SCT-001 from the input signals through implementation and reload
    Given I open the Step III SCT register
    When I create "Keep the customer promise" with its description, source, KPI, artifact, and method
    Then the register shows SCT-001 with one stable SCT identity

    When I describe the R+1, R0, and R-1 contributions in Step IV
    And I make the R0 organization accountable
    Then every contribution is attached to SCT-001 by the same SCT identity

    When I select S4 in Step V
    Then only the real R0 contribution is offered for mapping
    When I map that contribution to S4
    Then it is assigned to exactly one VSM system

    When I open the Step VI E2E check for SCT-001
    Then its route context contains the same SCT and all real Step IV contributions
    When I place the R0 contribution and record a high-severity delay finding
    Then the route, node, contribution, and finding retain their stable references
    When I rate a canonical communication loop as weak
    Then all required vertical loops remain available exactly once
    And the communication observation is retained for the same System-in-Focus

    When I create the accepted R0 role "Customer Promise Owner" in Step VII
    And I mark that role Accountable for the R0 contribution
    Then R0 is the default scope while the other recursion levels remain explicitly available
    And the RASIC assignment references the same canonical contribution
    And the KPI, artifact, and method authored in Step III are available in Step VII

    When I explicitly promote the E2E finding in Implementation
    Then one backlog item retains the stable route and finding provenance
    And the same finding cannot create a duplicate backlog item

    When I reload VSM7
    Then SCT-001 still has its original stable identity
    And its Step IV contribution, S4 mapping, Step VI route, Step VII accountability, and implementation source are restored
    And the workspace still contains exactly one canonical SCT
