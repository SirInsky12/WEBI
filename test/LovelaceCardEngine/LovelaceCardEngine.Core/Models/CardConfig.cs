using System;

namespace LovelaceCardEngine.Core.Models
{
    /// <summary>
    /// Raw card configuration from YAML/JSON
    /// </summary>
    public class CardConfig
    {
        public string Type { get; set; } = "";
        public string? Title { get; set; }
        public string? Icon { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();

        /// <summary>
        /// All configuration as raw dictionary (for parsing)
        /// </summary>
        public Dictionary<string, object> RawConfig { get; set; } = new();
    }

    /// <summary>
    /// Entities card configuration
    /// </summary>
    public class EntitiesCardConfig : CardConfig
    {
        public List<string> Entities { get; set; } = new();
        public Action? TapAction { get; set; }
        public Action? HoldAction { get; set; }
        public Action? DoubleTapAction { get; set; }
    }

    /// <summary>
    /// Button card configuration
    /// </summary>
    public class ButtonCardConfig : CardConfig
    {
        public string? Entity { get; set; }
        public Action? TapAction { get; set; }
        public Action? HoldAction { get; set; }
        public Action? DoubleTapAction { get; set; }
        public string? StateColor { get; set; }
    }

    /// <summary>
    /// Gauge card configuration
    /// </summary>
    public class GaugeCardConfig : CardConfig
    {
        public string? Entity { get; set; }
        public decimal Min { get; set; } = 0;
        public decimal Max { get; set; } = 100;
        public int? Decimals { get; set; }
        public string? Unit { get; set; }
        public List<GaugeSector>? Sectors { get; set; }
    }

    public class GaugeSector
    {
        public decimal From { get; set; }
        public decimal To { get; set; }
        public string Color { get; set; }
    }

    /// <summary>
    /// Markdown card configuration
    /// </summary>
    public class MarkdownCardConfig : CardConfig
    {
        public string Content { get; set; } = "";
    }

    /// <summary>
    /// Grid layout configuration
    /// </summary>
    public class GridCardConfig : CardConfig
    {
        public List<CardConfig> Cards { get; set; } = new();
        public int? Columns { get; set; }
        public string? SquareAspectRatio { get; set; }
    }

    /// <summary>
    /// Stack layout configuration (vertical or horizontal)
    /// </summary>
    public class StackCardConfig : CardConfig
    {
        public List<CardConfig> Cards { get; set; } = new();
        public string Direction { get; set; } = "vertical"; // vertical, horizontal
    }

    /// <summary>
    /// Dashboard view configuration
    /// </summary>
    public class ViewConfig
    {
        public string? Title { get; set; }
        public List<CardConfig> Cards { get; set; } = new();
        public string? Path { get; set; }
        public string? Icon { get; set; }
    }

    /// <summary>
    /// Root dashboard configuration
    /// </summary>
    public class DashboardConfig
    {
        public string? Title { get; set; }
        public List<ViewConfig> Views { get; set; } = new();
    }
}
