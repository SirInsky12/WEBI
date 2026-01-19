using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("=== Lovelace Card Engine Demo ===\n");

        // Initialize entity store with mock data
        var entityStore = new EntityStore();
        SetupMockEntities(entityStore);

        // Create parser and load example dashboard
        var parser = new LovelaceConfigParser();
        var dashboardYaml = LoadExampleDashboard();

        try
        {
            var config = parser.ParseYaml(dashboardYaml);
            Console.WriteLine($"✓ Dashboard loaded: {config.Title}");
            Console.WriteLine($"✓ Views: {config.Views.Count}\n");

            // Render all cards
            var factory = new CardRendererFactory();
            var actionExecutor = new ActionExecutor(entityStore);

            foreach (var view in config.Views)
            {
                Console.WriteLine($"\n--- View: {view.Title} ---");
                RenderCards(view.Cards, factory, entityStore, actionExecutor);
            }

            // Demonstrate state updates
            Console.WriteLine("\n\n=== State Update Demo ===");
            await DemoStateUpdates(entityStore);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }

    private static void SetupMockEntities(EntityStore store)
    {
        store.RegisterEntity(new Entity
        {
            Id = "light.living_room",
            Name = "Living Room Light",
            EntityType = "light",
            State = true,
            Unit = "brightness",
            Icon = "mdi:lightbulb",
            Attributes = new() { { "brightness", 200 } }
        });

        store.RegisterEntity(new Entity
        {
            Id = "switch.kitchen",
            Name = "Kitchen Switch",
            EntityType = "switch",
            State = false,
            Icon = "mdi:power-socket",
            IsAvailable = true
        });

        store.RegisterEntity(new Entity
        {
            Id = "sensor.temperature",
            Name = "Room Temperature",
            EntityType = "sensor",
            State = 22.5,
            Unit = "°C",
            Icon = "mdi:thermometer"
        });

        store.RegisterEntity(new Entity
        {
            Id = "sensor.humidity",
            Name = "Room Humidity",
            EntityType = "sensor",
            State = 65,
            Unit = "%",
            Icon = "mdi:water-percent"
        });

        store.RegisterEntity(new Entity
        {
            Id = "light.bedroom",
            Name = "Bedroom Light",
            EntityType = "light",
            State = false,
            Icon = "mdi:lightbulb"
        });
    }

    private static void RenderCards(List<CardConfig> cards, CardRendererFactory factory, IEntityStore entityStore, IActionExecutor actionExecutor)
    {
        foreach (var card in cards)
        {
            var rendered = factory.Render(card, entityStore);
            Console.WriteLine($"\n[{rendered.Type.ToUpper()}]");
            if (!string.IsNullOrEmpty(rendered.Title))
                Console.WriteLine($"Title: {rendered.Title}");
            Console.WriteLine($"Content: {rendered.Content[..Math.Min(150, rendered.Content.Length)]}...");

            if (rendered.ChildCards?.Count > 0)
            {
                Console.WriteLine($"Child Cards: {rendered.ChildCards.Count}");
                RenderCards(card switch
                {
                    GridCardConfig g => g.Cards,
                    StackCardConfig s => s.Cards,
                    _ => new()
                }, factory, entityStore, actionExecutor);
            }
        }
    }

    private static async Task DemoStateUpdates(EntityStore store)
    {
        Console.WriteLine("Toggling light.living_room...");
        var sub = store.SubscribeToEntity("light.living_room", entity =>
        {
            Console.WriteLine($"  Update: {entity.Id} -> {entity.State}");
        });

        store.UpdateEntityState("light.living_room", false);
        await Task.Delay(500);
        store.UpdateEntityState("light.living_room", true);
        await Task.Delay(500);

        Console.WriteLine("\nTemperature sensor update:");
        store.UpdateEntityState("sensor.temperature", 23.8);

        sub.Dispose();
    }

    private static string LoadExampleDashboard() => @"
title: Smart Home Dashboard
views:
  - title: Living Room
    path: living-room
    icon: mdi:sofa
    cards:
      - type: entities
        title: Lights
        icon: mdi:lightbulb
        entities:
          - light.living_room
          - light.bedroom
        tap_action:
          action: toggle

      - type: button
        title: Kitchen Switch
        entity: switch.kitchen
        tap_action:
          action: toggle

      - type: grid
        columns: 2
        cards:
          - type: gauge
            title: Temperature
            entity: sensor.temperature
            min: 10
            max: 35
            unit: °C
            decimals: 1

          - type: gauge
            title: Humidity
            entity: sensor.humidity
            min: 0
            max: 100
            unit: '%'

      - type: markdown
        title: Info
        content: |
          # Welcome to Smart Home
          
          This is a demo of the Lovelace Card Engine.
          - Entities card for listing multiple entities
          - Button card for single entity control
          - Gauge cards for numeric values
          - Markdown card for documentation
";
}
