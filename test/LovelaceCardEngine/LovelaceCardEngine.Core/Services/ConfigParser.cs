using System;
using System.Text.Json;
using YamlDotNet.Serialization;
using LovelaceCardEngine.Core.Models;

namespace LovelaceCardEngine.Core.Services
{
    /// <summary>
    /// Parses Lovelace YAML/JSON configurations
    /// </summary>
    public interface IConfigParser
    {
        DashboardConfig ParseYaml(string yaml);
        DashboardConfig ParseJson(string json);
        CardConfig ParseCardConfig(Dictionary<string, object> raw);
    }

    public class LovelaceConfigParser : IConfigParser
    {
        public DashboardConfig ParseYaml(string yaml)
        {
            var deserializer = new DeserializerBuilder().Build();
            var obj = deserializer.Deserialize<Dictionary<string, object>>(yaml) 
                ?? throw new InvalidOperationException("Invalid YAML");

            return ParseDashboard(obj);
        }

        public DashboardConfig ParseJson(string json)
        {
            var obj = JsonSerializer.Deserialize<Dictionary<string, object>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? throw new InvalidOperationException("Invalid JSON");

            return ParseDashboard(obj);
        }

        private DashboardConfig ParseDashboard(Dictionary<string, object> raw)
        {
            var config = new DashboardConfig
            {
                Title = raw.TryGetValue("title", out var title) ? title.ToString() : null,
                Views = new()
            };

            if (raw.TryGetValue("views", out var viewsObj) && viewsObj is List<object> viewsList)
            {
                foreach (var viewObj in viewsList)
                {
                    if (viewObj is Dictionary<string, object> viewDict)
                        config.Views.Add(ParseView(viewDict));
                }
            }

            return config;
        }

        private ViewConfig ParseView(Dictionary<string, object> raw)
        {
            var view = new ViewConfig
            {
                Title = raw.TryGetValue("title", out var title) ? title.ToString() : null,
                Path = raw.TryGetValue("path", out var path) ? path.ToString() : null,
                Icon = raw.TryGetValue("icon", out var icon) ? icon.ToString() : null,
                Cards = new()
            };

            if (raw.TryGetValue("cards", out var cardsObj) && cardsObj is List<object> cardsList)
            {
                foreach (var cardObj in cardsList)
                {
                    if (cardObj is Dictionary<string, object> cardDict)
                        view.Cards.Add(ParseCardConfig(cardDict));
                }
            }

            return view;
        }

        public CardConfig ParseCardConfig(Dictionary<string, object> raw)
        {
            var typeStr = raw.TryGetValue("type", out var type) ? type.ToString() : "unknown";

            var baseConfig = new CardConfig
            {
                Type = typeStr,
                Title = raw.TryGetValue("title", out var title) ? title.ToString() : null,
                Icon = raw.TryGetValue("icon", out var icon) ? icon.ToString() : null,
                RawConfig = raw
            };

            // Parse specific card types
            return typeStr switch
            {
                "entities" => ParseEntitiesCard(baseConfig, raw),
                "button" => ParseButtonCard(baseConfig, raw),
                "gauge" => ParseGaugeCard(baseConfig, raw),
                "markdown" => ParseMarkdownCard(baseConfig, raw),
                "grid" => ParseGridCard(baseConfig, raw),
                "vertical-stack" => ParseStackCard(baseConfig, raw, "vertical"),
                "horizontal-stack" => ParseStackCard(baseConfig, raw, "horizontal"),
                _ => baseConfig
            };
        }

        private EntitiesCardConfig ParseEntitiesCard(CardConfig baseConfig, Dictionary<string, object> raw)
        {
            var config = new EntitiesCardConfig { Type = baseConfig.Type, Title = baseConfig.Title, Icon = baseConfig.Icon };

            if (raw.TryGetValue("entities", out var ent) && ent is List<object> entList)
            {
                config.Entities = entList
                    .OfType<string>()
                    .ToList();
            }

            config.TapAction = ParseAction(raw, "tap_action");
            config.HoldAction = ParseAction(raw, "hold_action");
            config.DoubleTapAction = ParseAction(raw, "double_tap_action");

            return config;
        }

        private ButtonCardConfig ParseButtonCard(CardConfig cfg, Dictionary<string, object> raw)
        {
            var config = new ButtonCardConfig 
            { 
                Type = cfg.Type, 
                Title = cfg.Title, 
                Icon = cfg.Icon,
                Entity = raw.TryGetValue("entity", out var e) ? e.ToString() : null
            };

            config.TapAction = ParseAction(raw, "tap_action");
            config.HoldAction = ParseAction(raw, "hold_action");
            config.DoubleTapAction = ParseAction(raw, "double_tap_action");
            config.StateColor = raw.TryGetValue("state_color", out var sc) ? sc.ToString() : null;

            return config;
        }

        private GaugeCardConfig ParseGaugeCard(CardConfig cfg, Dictionary<string, object> raw)
        {
            var config = new GaugeCardConfig 
            { 
                Type = cfg.Type, 
                Title = cfg.Title, 
                Icon = cfg.Icon,
                Entity = raw.TryGetValue("entity", out var e) ? e.ToString() : null
            };

            if (raw.TryGetValue("min", out var min) && decimal.TryParse(min.ToString(), out var minVal))
                config.Min = minVal;
            
            if (raw.TryGetValue("max", out var max) && decimal.TryParse(max.ToString(), out var maxVal))
                config.Max = maxVal;

            if (raw.TryGetValue("unit", out var unit))
                config.Unit = unit.ToString();

            if (raw.TryGetValue("decimals", out var dec) && int.TryParse(dec.ToString(), out var decVal))
                config.Decimals = decVal;

            return config;
        }

        private MarkdownCardConfig ParseMarkdownCard(CardConfig cfg, Dictionary<string, object> raw)
        {
            var config = new MarkdownCardConfig 
            { 
                Type = cfg.Type, 
                Title = cfg.Title, 
                Icon = cfg.Icon,
                Content = raw.TryGetValue("content", out var c) ? c.ToString() ?? "" : ""
            };

            return config;
        }

        private GridCardConfig ParseGridCard(CardConfig cfg, Dictionary<string, object> raw)
        {
            var config = new GridCardConfig 
            { 
                Type = cfg.Type, 
                Title = cfg.Title, 
                Icon = cfg.Icon,
                Cards = new()
            };

            if (raw.TryGetValue("columns", out var cols) && int.TryParse(cols.ToString(), out var colsVal))
                config.Columns = colsVal;

            if (raw.TryGetValue("square", out var sq))
                config.SquareAspectRatio = sq.ToString();

            if (raw.TryGetValue("cards", out var cardsObj) && cardsObj is List<object> cardsList)
            {
                foreach (var cardObj in cardsList)
                {
                    if (cardObj is Dictionary<string, object> cardDict)
                        config.Cards.Add(ParseCardConfig(cardDict));
                }
            }

            return config;
        }

        private StackCardConfig ParseStackCard(CardConfig cfg, Dictionary<string, object> raw, string direction)
        {
            var config = new StackCardConfig 
            { 
                Type = cfg.Type, 
                Title = cfg.Title, 
                Icon = cfg.Icon,
                Direction = direction,
                Cards = new()
            };

            if (raw.TryGetValue("cards", out var cardsObj) && cardsObj is List<object> cardsList)
            {
                foreach (var cardObj in cardsList)
                {
                    if (cardObj is Dictionary<string, object> cardDict)
                        config.Cards.Add(ParseCardConfig(cardDict));
                }
            }

            return config;
        }

        private Models.Action? ParseAction(Dictionary<string, object> raw, string actionKey)
        {
            if (!raw.TryGetValue(actionKey, out var actionObj))
                return null;

            if (actionObj is not Dictionary<string, object> actionDict)
                return null;

            var action = new Models.Action
            {
                ActionType = actionDict.TryGetValue("action", out var at) ? at.ToString() ?? "toggle" : "toggle",
                Target = actionDict.TryGetValue("target", out var target) ? target.ToString() : null,
                NavigateTo = actionDict.TryGetValue("navigate_to", out var nav) ? nav.ToString() : null,
                Service = actionDict.TryGetValue("service", out var svc) ? svc.ToString() : null
            };

            if (actionDict.TryGetValue("service_data", out var sd) && sd is Dictionary<string, object> sdDict)
                action.ServiceData = sdDict;

            return action;
        }
    }
}
