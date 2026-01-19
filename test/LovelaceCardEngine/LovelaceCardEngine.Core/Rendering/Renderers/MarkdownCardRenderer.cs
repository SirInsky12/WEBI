using System;
using LovelaceCardEngine.Core.Models;
using LovelaceCardEngine.Core.Services;
using LovelaceCardEngine.Core.Rendering;

namespace LovelaceCardEngine.Core.Rendering.Renderers
{
    /// <summary>
    /// Renders markdown card
    /// </summary>
    public class MarkdownCardRenderer : ICardRenderer
    {
        public bool CanRender(string cardType) => cardType == "markdown";

        public RenderedCard Render(CardConfig config, IEntityStore entityStore)
        {
            var markdownConfig = config as MarkdownCardConfig
                ?? throw new ArgumentException("Invalid markdown card config");

            var html = $@"
                <div class='markdown-card'>
                    {(string.IsNullOrEmpty(markdownConfig.Title) ? "" : $"<h3>{markdownConfig.Title}</h3>")}
                    <div class='markdown-content'>
                        {System.Net.WebUtility.HtmlEncode(markdownConfig.Content).Replace("\n", "<br>")}
                    </div>
                </div>";

            return new RenderedCard("markdown", html)
            {
                Title = markdownConfig.Title,
                Icon = markdownConfig.Icon
            };
        }
    }
}
